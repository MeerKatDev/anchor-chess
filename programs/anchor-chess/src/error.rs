use anchor_lang::prelude::*;

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
