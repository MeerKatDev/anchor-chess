// Stops Rust Analyzer complaining about missing configs
// See https://solana.stackexchange.com/questions/17777
#![allow(unexpected_cfgs)]
// Fix warning: use of deprecated method `anchor_lang::prelude::AccountInfo::<'a>::realloc`: Use AccountInfo::resize() instead
// See https://solana.stackexchange.com/questions/22979
#![allow(deprecated)]

use anchor_lang::prelude::*;

use std::convert::TryFrom;

pub mod game_logic;

declare_id!("31xiptEVG9npfKRzuToPsBGwrBs6tSw5bRj6VhSnMgWH");

#[program]
pub mod anchor_chess {
    use super::*;

    /// Initializes chess board on-chain
    /// Maker has always white pieces
    pub fn initialize(ctx: Context<Initialize>, guest: Option<Pubkey>, seed: u64) -> Result<()> {
        let board = Board::new(ctx.bumps.board, seed, guest, ctx.accounts.maker.key());

        ctx.accounts.board.set_inner(board);

        Ok(())
    }

    /// Optional: the guest joins in a second moment.
    /// Guest joins chess board
    pub fn join(ctx: Context<Join>, guest: Pubkey) -> Result<()> {
        let board = &mut ctx.accounts.board;

        require!(board.guest.is_none(), ChessError::GuestAlreadyPresent);

        board.guest = Some(guest);

        Ok(())
    }

    pub fn move_piece(ctx: Context<Move>, piece_idx: u8, destination: u8) -> Result<()> {
        // --- Bounds check ---
        require!(piece_idx < 64 && destination < 64, ChessError::OutOfBounds);

        let board = &mut ctx.accounts.board;
        let player_key = ctx.accounts.player.key();

        // --- Ensure both players are present ---
        require!(board.guest.is_some(), ChessError::GuestPlayerNotPresent);

        // --- Validate that the correct player is moving ---
        let valid_player = if board.is_white_turn {
            player_key == board.maker
        } else {
            Some(player_key) == board.guest
        };
        require!(valid_player, ChessError::InvalidPlayer);

        // --- Validate that the piece belongs to the player ---
        let is_moving_white = board.is_white_turn;
        require!(
            (is_moving_white && piece_idx < 16) || (!is_moving_white && piece_idx >= 16),
            ChessError::InvalidPlayer
        );

        // --- Ensure destination is different ---
        require!(
            board.state[piece_idx as usize] != destination,
            ChessError::InvalidMove
        );

        // --- Validate move legality ---
        require!(board.is_move_legal(piece_idx, destination)?, ChessError::InvalidMove);

        // --- Capture any opposite color piece at the destination ---
        let mut target_range = if is_moving_white { 16..32 } else { 0..16 };
        if let Some(capture_idx) = target_range
            .find(|&idx| board.state[idx] == destination)
        {
            board.state[capture_idx] = 0; // captured
        }

        // --- Move the piece ---
        board.state[piece_idx as usize] = destination;

        // --- Swap turn ---
        board.is_white_turn = !board.is_white_turn;

        // TODO: count points, update game state, emit events, etc.

        Ok(())
    }


    /// resign - end the game earlier
    pub fn resign(ctx: Context<Resign>) -> Result<()> {
        ctx.accounts.board.resign(ctx.accounts.maker.key())?;

        Ok(())
    }

    /// Close the board account
    pub fn close(_ctx: Context<Close>) -> Result<()> {
        // Anchor will automatically transfer lamports back to `maker` and close account
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init,
        payer = maker,
        space = Board::INIT_SPACE + Board::DISCRIMINATOR.len(),
        seeds = [b"board", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub board: Account<'info, Board>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Join<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mut,
        seeds = [b"board", maker.key().as_ref(), board.seed.to_le_bytes().as_ref()],
        bump = board.bump,
        has_one = maker,
    )]
    pub board: Account<'info, Board>,
}

#[derive(Accounts)]
// system program not required
pub struct Move<'info> {
    /// The player making the move
    #[account(mut)]
    pub player: Signer<'info>,

    /// The board account to update
    #[account(
        mut,
        seeds = [b"board", board.maker.key().as_ref(), board.seed.to_le_bytes().as_ref()],
        bump = board.bump,
    )]
    pub board: Account<'info, Board>,
}

#[derive(Accounts)]
pub struct Resign<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(mut)]
    pub board: Account<'info, Board>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    #[account(
      mut,
      close = maker,
      seeds = [b"board", maker.key().as_ref(), board.seed.to_le_bytes().as_ref()],
      bump = board.bump
  )]
    pub board: Box<Account<'info, Board>>,
}

#[derive(InitSpace)]
#[account(discriminator = 1)]
pub struct Board {
    pub is_white_turn: bool,
    pub bump: u8,
    pub seed: u64,
    pub maker: Pubkey,
    pub guest: Option<Pubkey>,
    /// 0-based coordinate of pieces
    /// the index will show WHICH piece it is
    /// the number will tell the position.
    /// First 16 are white, other 16 are black.
    /// The whites are at the bottom, 0-index is the left tower.
    pub state: [u8; 32],
}

impl Board {
    pub fn new(bump: u8, seed: u64, guest: Option<Pubkey>, maker: Pubkey) -> Self {
        Self {
            is_white_turn: true,
            bump,
            seed,
            guest,
            maker,
            state: Self::new_chessboard(),
        }
    }

    pub fn resign(&mut self, resigning_player: Pubkey) -> Result<()> {
        // Check that resigning player is one of the two
        require!(
            resigning_player.eq(&self.maker) || Some(resigning_player).eq(&self.guest),
            ChessError::InvalidPlayer
        );

        Ok(())
    }

    pub fn is_move_legal(&self, piece_idx: u8, destination: u8) -> Result<bool> {
        let piece = PieceType::try_from(piece_idx)?;
        let current_pos = self.state[piece_idx as usize];

        if destination == current_pos {
            return Err(ChessError::InvalidMove.into());
        }

        let is_white = piece_idx < 16; // white = first 16 pieces

        let legal = match piece {
            PieceType::Pawn => game_logic::is_pawn_move(current_pos, destination, is_white),
            PieceType::Rook => game_logic::is_rook_move(current_pos, destination),
            PieceType::Knight => game_logic::is_knight_move(current_pos, destination),
            PieceType::Bishop => game_logic::is_bishop_move(current_pos, destination),
            PieceType::Queen => game_logic::is_queen_move(current_pos, destination),
            PieceType::King => game_logic::is_king_move(current_pos, destination),
        };

        Ok(legal)
    }

    pub fn new_chessboard() -> [u8; 32] {
        let state: Vec<u8> = [
            // White back rank: 1..=8
            (1..=8).collect::<Vec<u8>>(),
            // White pawns: 9..=16
            (9..=16).collect::<Vec<u8>>(),
            // Black pawns: 49..=56
            (49..=56).collect::<Vec<u8>>(),
            // Black back rank: 57..=64
            (57..=64).collect::<Vec<u8>>(),
        ]
        .concat();

        state.try_into().unwrap()
    }
}

#[error_code]
pub enum ChessError {
    #[msg("Invalid move")]
    InvalidMove,
    #[msg("Invalid creator")]
    InvalidCreator,
    #[msg("Invalid player")]
    InvalidPlayer,
    #[msg("Guest player not present")]
    GuestPlayerNotPresent,
    #[msg("Out of board bounds")]
    OutOfBounds,
    #[msg("Destination is occupied")]
    BusyDestination,
    #[msg("Wrong piece")]
    InvalidPiece,
    #[msg("A guest already joined")]
    GuestAlreadyPresent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PieceType {
    Rook,
    Knight,
    Bishop,
    Queen,
    King,
    Pawn,
}

impl TryFrom<u8> for PieceType {
    type Error = anchor_lang::error::Error;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            // Rooks
            1 | 8 | 25 | 32 => Ok(PieceType::Rook),
            // Knights
            2 | 7 | 26 | 31 => Ok(PieceType::Knight),
            // Bishops
            3 | 6 | 27 | 30 => Ok(PieceType::Bishop),
            // Queens
            4 | 28 => Ok(PieceType::Queen),
            // Kings
            5 | 29 => Ok(PieceType::King),
            // Pawns
            9..=24 => Ok(PieceType::Pawn),
            //
            _ => Err(ChessError::InvalidPiece.into()),
        }
    }
}

impl PieceType {
    /// Returns all 1-based indices for this piece type
    pub fn indices(&self) -> Vec<u8> {
        match self {
            PieceType::Rook => vec![1, 8, 25, 32],
            PieceType::Knight => vec![2, 7, 26, 31],
            PieceType::Bishop => vec![3, 6, 27, 30],
            PieceType::Queen => vec![4, 28],
            PieceType::King => vec![5, 29],
            PieceType::Pawn => (9..=16).chain(17..=24).collect(),
        }
    }
}
