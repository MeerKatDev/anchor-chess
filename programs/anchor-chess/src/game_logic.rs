/// Contains game logic for chess
/// It shouldn't be dependent on Anchor stuff
/// It should be a drop in replacement to any Rust program.
use crate::ChessError;
use std::convert::TryFrom;

pub fn is_move_legal(
    current_pos: u8,
    piece_idx: u8,
    destination: u8,
    board_state: &[u8; 32],
) -> Result<bool, ChessError> {
    let piece = PieceType::try_from(piece_idx)?;

    if destination == current_pos {
        return Err(ChessError::NoMovement);
    }

    let is_white = piece_idx < 16; // white = first 16 pieces

    let legal = match piece {
        PieceType::Pawn => is_pawn_move(current_pos, destination, is_white, board_state),
        PieceType::Rook => is_rook_move(current_pos, destination),
        PieceType::Knight => is_knight_move(current_pos, destination, is_white, board_state),
        PieceType::Bishop => is_bishop_move(current_pos, destination),
        PieceType::Queen => is_queen_move(current_pos, destination),
        PieceType::King => is_king_move(current_pos, destination),
    };

    Ok(legal)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PieceType {
    Rook,
    Knight,
    Bishop,
    Queen,
    King,
    Pawn,
}

impl TryFrom<u8> for PieceType {
    type Error = ChessError;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
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
            _ => Err(ChessError::InvalidPiece),
        }
    }
}

impl PieceType {
    /// Returns all 1-based indices for this piece type
    #[allow(dead_code)]
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

fn is_pawn_move(current: u8, destination: u8, is_white: bool, board_state: &[u8; 32]) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    let dir = if is_white { 1 } else { -1 };

    // Check forward one square blocked
    if cx == dx && dy - cy == dir && !board_state.contains(&destination) {
        return true;
    }

    // Forward two steps from starting rank (both squares must be empty)
    if cx == dx && dy - cy == 2 * dir {
        let start_rank = if is_white { 1 } else { 6 };
        if cy == start_rank {
            let between_square = (cy + dir) * 8 + cx; // compute square in front
            let between_square = between_square as u8;
            if !board_state.contains(&between_square) && !board_state.contains(&destination) {
                return true;
            }
        }
    }

    // Capture diagonally
    if (dx - cx).abs() == 1 && dy - cy == dir {
        {
            let mut opponent_range = if is_white { 16..32 } else { 0..16 };
            return opponent_range.any(|i| board_state[i] == destination);
        }
    }

    false
}

fn is_rook_move(current: u8, destination: u8) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    cx == dx || cy == dy
}

fn is_knight_move(current: u8, destination: u8, is_white: bool, board_state: &[u8; 32]) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    let dx_abs = (dx - cx).abs();
    let dy_abs = (dy - cy).abs();

    // Check standard knight "L-shape" move
    if !((dx_abs == 1 && dy_abs == 2) || (dx_abs == 2 && dy_abs == 1)) {
        return false;
    }

    // Cannot land on a friendly piece
    let mut friendly_range = if is_white { 0..16 } else { 16..32 };
    if friendly_range.any(|i| board_state[i] == destination) {
        return false;
    }

    true
}

fn is_bishop_move(current: u8, destination: u8) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    (dx - cx).abs() == (dy - cy).abs()
}

fn is_queen_move(current: u8, destination: u8) -> bool {
    is_rook_move(current, destination) || is_bishop_move(current, destination)
}

fn is_king_move(current: u8, destination: u8) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    (dx - cx).abs() <= 1 && (dy - cy).abs() <= 1
}

fn to_coords(pos: u8) -> (i8, i8) {
    (pos as i8 % 8, pos as i8 / 8) // (x, y)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pawn_captures() {
        let mut board: [u8; 32] = [0; 32];
        // Setup white pawn at a2 (pos 8) and black pawn at b3 (pos 17)
        board[8] = 8; // white pawn index 8
        board[16] = 17; // black pawn index 16

        // Can't move diagonally to empty square
        assert!(!is_pawn_move(8, 9, true, &board));

        // Can capture black pawn diagonally
        assert!(is_pawn_move(8, 17, true, &board));

        // Forward moves still work if not blocked
        assert!(is_pawn_move(8, 16, true, &board));
    }

    #[test]
    fn test_pawn_double_step_blocked() {
        let mut board: [u8; 32] = [0; 32];
        // White pawn at a2 (pos 8)
        board[8] = 8;
        // Block a3
        board[16] = 16;

        // Double move blocked
        assert!(!is_pawn_move(8, 24, true, &board));

        // Single move blocked
        assert!(!is_pawn_move(8, 16, true, &board));
    }

    #[test]
    fn test_pawn_moves_black_with_capture() {
        let mut board: [u8; 32] = [0; 32];

        // Black pawn at a7 (square 48)
        board[16] = 48; // first black pawn
                        // White pawn at b6 (square 41)
        board[0] = 41; // first white pawn

        // Board diagram for capture test:
        // 8 | . . . .
        // 7 | b . . .
        // 6 | . w . .
        //     a b c d

        // Black pawn a7 captures white pawn b6 (diagonal right)
        assert!(is_pawn_move(48, 41, false, &board));

        // Board diagram for blocked forward:
        // 8 | . . .
        // 7 | b . .
        // 6 | b w .
        //     a b c
        board[15] = 40; // second black pawn

        // Black pawn a7 tries to move forward to a6 (blocked by friendly pawn)
        assert!(!is_pawn_move(48, 40, false, &board));
    }

    // pawns start at index 8 but from position 9 to 16
    #[test]
    fn test_pawn_moves_white() {
        // Setup board: 32 pieces, 0 = empty, positions = current square of each piece
        let mut board: [u8; 32] = [0; 32];

        // Place white pawns at a2..h2 (squares 8..15)
        for (i, pos) in (1..=16).enumerate() {
            board[i] = pos;
        }

        // Place a black pawn at b3 (square 17) to test diagonal capture
        board[16] = 18; // index 16 = black pawn at b3

        println!("{:?}", board);

        // Test single and double steps
        assert!(is_pawn_move(9, 17, true, &board)); // a2 -> a3
        assert!(is_pawn_move(9, 25, true, &board)); // a2 -> a4

        // Test invalid too far
        assert!(!is_pawn_move(9, 33, true, &board)); // a2 -> a5 (too far)

        // Test captures
        // 4 | . . . .
        // 3 | b . . .
        // 2 | . w . .
        //  ... other pieces ..
        //     a b c d
        // also seen as
        // 4 |  . . . .
        // 3 | 17 . . .
        // 2 |  . 9 . .
        //  ... other pieces ..
        //     a b c d
        assert!(is_pawn_move(9, 17, true, &board)); // b2 captures a3 (diagonal left)

        // Cannot capture empty square diagonally
        assert!(!is_pawn_move(8, 15, true, &board)); // a2 -> h3 (no piece)
    }

    #[test]
    fn test_pawn_moves_black() {
        let mut board: [u8; 32] = [0; 32];

        // Place black pawns at a7..h7 (squares 48..55)
        for (i, pos) in (48..=55).enumerate() {
            board[16 + i] = pos;
        }

        // Place white pawn at b6 (square 41) to test capture
        board[1] = 41; // index 1 = white pawn at b6

        // Test forward moves
        assert!(is_pawn_move(48, 40, false, &board)); // a7 -> a6
        assert!(is_pawn_move(48, 32, false, &board)); // a7 -> a5
        assert!(!is_pawn_move(48, 24, false, &board)); // a7 -> a4 (too far)

        // Test capture
        assert!(is_pawn_move(48, 41, false, &board)); // a7 captures b6

        // Cannot capture off-board
        assert!(!is_pawn_move(48, 47, false, &board)); // a7 -> h6 (empty)
                                                       // TOCHECK
                                                       // assert!(is_pawn_move(49, 40, false, &board));  // b7 captures a6
        assert!(!is_pawn_move(49, 42, false, &board)); // b7 -> c6 (empty)
    }

    #[test]
    fn test_rook_moves() {
        // Rook at (0,0) = square 0
        assert!(is_rook_move(0, 7)); // same row
        assert!(is_rook_move(0, 56)); // same column
        assert!(!is_rook_move(0, 9)); // diagonal
    }

    #[test]
    fn test_knight_moves() {
        // Setup empty board: 0 = empty, other positions = piece locations
        let mut board: [u8; 32] = [0; 32];

        // Place white knight at b1 (square 1)
        board[1] = 1;

        let is_white = true;

        // --- Move two up, one left: valid ---
        //
        // 3 | . . . . . . . .
        // 2 | . . . . . . . .
        // 1 | . N . . . . . .
        //     a b c d e f g h
        assert!(is_knight_move(1, 16, is_white, &board));

        // --- Move two up, one right: valid ---
        //
        // 3 | . . . . . . . .
        // 2 | . . . . . . . .
        // 1 | . N . . . . . .
        //     a b c d e f g h
        assert!(is_knight_move(1, 18, is_white, &board));

        // --- Invalid: one right only ---
        //
        // 1 | . N . . . . . .
        //     a b c d e f g h
        assert!(!is_knight_move(1, 2, is_white, &board));

        // --- Invalid: landing on friendly piece ---
        board[5] = 18; // pretend white piece at square 19 (destination)
        assert!(!is_knight_move(1, 19, is_white, &board));

        board[10] = 3; // place another friendly piece at square 10
        assert!(!is_knight_move(1, 10, is_white, &board)); // assert 2

        board[18] = 16; // pretend black piece at square 10 (destination)
        assert!(is_knight_move(1, 16, is_white, &board));
    }

    #[test]
    fn test_bishop_moves() {
        // Bishop at (2,0) = square 2
        assert!(is_bishop_move(2, 9)); // diagonal
        assert!(is_bishop_move(2, 16)); // diagonal further
        assert!(!is_bishop_move(2, 3)); // horizontal
    }

    #[test]
    fn test_queen_moves() {
        // --- Horizontal: d1 → h1 (3 → 7) ---
        //
        // 1 | . . . Q . . . X
        //     a b c d e f g h
        assert!(is_queen_move(3, 7)); // horizontal to h1

        // --- Vertical: d1 → d2 (3 → 11) ---
        //
        // 2 | . . . X .
        // 1 | . . . Q .
        //     a b c d e
        assert!(is_queen_move(3, 11)); // vertical to d2

        // --- Diagonal: d1 → c2 (3 → 10) ---
        //
        // 2 | . . X .
        // 1 | . . . Q
        //     a b c d
        assert!(is_queen_move(3, 10)); // diagonal to c2

        // --- Diagonal: d1 → b3 (3 → 17) ---
        //
        // 3 | . X . .
        // 2 | . . . .
        // 1 | . . . Q
        //     a b c d
        assert!(is_queen_move(3, 17)); // diagonal to b3

        // --- Invalid: d1 → c3 (3 → 18) ---
        //
        // 3 | . . X .
        // 2 | . . . .
        // 1 | . . . Q
        //     a b c d
        assert!(!is_queen_move(3, 18)); // invalid: not straight or diagonal
    }

    #[test]
    fn test_king_moves() {
        assert!(is_king_move(4, 5)); // right
        assert!(is_king_move(4, 12)); // up
        assert!(is_king_move(4, 13)); // diagonal
        assert!(!is_king_move(4, 20)); // too far
    }

    #[test]
    fn test_to_coords() {
        assert_eq!(to_coords(0), (0, 0));
        assert_eq!(to_coords(7), (7, 0));
        assert_eq!(to_coords(8), (0, 1));
        assert_eq!(to_coords(63), (7, 7));
    }
}
