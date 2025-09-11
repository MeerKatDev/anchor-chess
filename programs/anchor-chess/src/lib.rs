// Stops Rust Analyzer complaining about missing configs
// See https://solana.stackexchange.com/questions/17777
#![allow(unexpected_cfgs)]
// Fix warning: use of deprecated method `anchor_lang::prelude::AccountInfo::<'a>::realloc`: Use AccountInfo::resize() instead
// See https://solana.stackexchange.com/questions/22979
#![allow(deprecated)]

use anchor_lang::prelude::*;

mod board;
mod error;
mod game_logic;

use crate::board::Board;
use crate::error::ChessError;

declare_id!("31xiptEVG9npfKRzuToPsBGwrBs6tSw5bRj6VhSnMgWH");

#[program]
pub mod anchor_chess {
    use super::*;

    /// Initializes chess board on-chain
    /// Maker has always white pieces
    pub fn initialize(ctx: Context<Initialize>, seed: u64, guest: Option<Pubkey>) -> Result<()> {
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
        require!(piece_idx < 32 && destination <= 64, ChessError::OutOfBounds);

        let board = &mut ctx.accounts.board;
        let player_key = ctx.accounts.player.key();

        // --- Ensure both players are present ---
        require!(board.guest.is_some(), ChessError::GuestPlayerNotPresent);

        let is_valid = if board.is_white_turn {
            // White’s turn: must be maker, and piece must be in 0..16
            player_key == board.maker && piece_idx < 16
        } else {
            // Black’s turn: must be guest, and piece must be in 16..32
            Some(player_key) == board.guest && piece_idx >= 16
        };

        require!(is_valid, ChessError::InvalidPlayer);

        // --- Validate move legality ---
        let current_pos = board.state[piece_idx as usize];
        let move_legal = game_logic::is_move_legal(current_pos, piece_idx, destination);
        require!(move_legal?, ChessError::InvalidMove);

        // --- Capture any opposite color piece at the destination ---
        let mut target_range = if board.is_white_turn { 16..32 } else { 0..16 };
        if let Some(capture_idx) = target_range.find(|&idx| board.state[idx] == destination) {
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
