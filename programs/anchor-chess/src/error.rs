use anchor_lang::prelude::*;

#[error_code]
pub enum ChessError {
    #[msg("Origin and destination are the same place.")]
    NoMovement,
    #[msg("Pieces don't move like that.")]
    IllegalMove,
    #[msg("Invalid creator")]
    InvalidCreator,
    #[msg("Invalid player")]
    InvalidPlayer,
    #[msg("Guest player not present")]
    GuestPlayerNotPresent,
    #[msg("Out of board bounds")]
    OutOfBounds,
    #[msg("Destination is occupied.")]
    BusyDestination,
    #[msg("Wrong piece")]
    InvalidPiece,
    #[msg("A guest already joined")]
    GuestAlreadyPresent,
    #[msg("Cannot close the match.")]
    CannotCloseMatch,
}
