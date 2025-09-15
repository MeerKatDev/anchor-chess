use crate::ChessError;
use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account(discriminator = 1)]
pub struct Board {
    pub is_white_turn: bool,
    pub bump: u8,
    pub seed: u64,
    pub maker: Pubkey,
    pub guest: Option<Pubkey>,
    /// 1-based coordinate of pieces
    /// the index will show WHICH piece it is
    /// the number will tell the position.
    /// First 16 are white, other 16 are black.
    /// The whites are at the bottom, 1-index is the left tower.
    pub state: [u8; 32],
    pub game_over: bool,
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
            game_over: false,
        }
    }

    pub fn resign(&mut self, resigning_player: Pubkey) -> Result<()> {
        // Check that resigning player is one of the two
        require!(
            resigning_player.eq(&self.maker) || Some(resigning_player).eq(&self.guest),
            ChessError::InvalidPlayer
        );

        self.game_over = true;

        Ok(())
    }

    pub fn new_chessboard() -> [u8; 32] {
        let mut state = [0u8; 32];

        // White back rank: 1..=8
        for (i, v) in (1..=8).enumerate() {
            state[i as usize] = v;
        }
        // White pawns: 9..=16
        for (i, v) in (9..=16).enumerate() {
            state[8 + i as usize] = v;
        }
        // Black pawns: 49..=56
        for (i, v) in (49..=56).enumerate() {
            state[16 + i as usize] = v;
        }
        // Black back rank: 57..=64
        for (i, v) in (57..=64).enumerate() {
            state[24 + i as usize] = v;
        }

        state
    }
}
