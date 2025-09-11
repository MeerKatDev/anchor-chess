/// Contains game logic for chess
/// It shouldn't be dependent on Anchor stuff
/// It should be a drop in replacement to any Rust program.
use crate::ChessError;
use std::convert::TryFrom;

pub fn is_move_legal(current_pos: u8, piece_idx: u8, destination: u8) -> Result<bool, ChessError> {
    let piece = PieceType::try_from(piece_idx)?;

    if destination == current_pos {
        return Err(ChessError::InvalidMove);
    }

    let is_white = piece_idx < 16; // white = first 16 pieces

    let legal = match piece {
        PieceType::Pawn => is_pawn_move(current_pos, destination, is_white),
        PieceType::Rook => is_rook_move(current_pos, destination),
        PieceType::Knight => is_knight_move(current_pos, destination),
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

fn is_pawn_move(current: u8, destination: u8, is_white: bool) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    let dir = if is_white { 1 } else { -1 };

    // Move forward by one
    if cx == dx && dy - cy == dir {
        return true;
    }

    // Move forward two from starting rank
    if cx == dx && dy - cy == 2 * dir && ((is_white && cy == 1) || (!is_white && cy == 6)) {
        return true;
    }

    // Capture diagonally
    if (dx - cx).abs() == 1 && dy - cy == dir {
        return true;
    }

    false
}

fn is_rook_move(current: u8, destination: u8) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    cx == dx || cy == dy
}

fn is_knight_move(current: u8, destination: u8) -> bool {
    let (cx, cy) = to_coords(current);
    let (dx, dy) = to_coords(destination);

    let dx = (dx - cx).abs();
    let dy = (dy - cy).abs();

    (dx == 1 && dy == 2) || (dx == 2 && dy == 1)
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
    fn test_pawn_moves_white() {
        // White pawn at (0,1) = square 8
        assert!(is_pawn_move(8, 16, true)); // single step forward
        assert!(is_pawn_move(8, 24, true)); // double step from start
        assert!(!is_pawn_move(8, 32, true)); // too far
        assert!(is_pawn_move(8, 17, true)); // capture diagonal right
                                            // fails
                                            // assert!(is_pawn_move(8, 15, true)); // capture diagonal left

        // a2 cannot capture "left" (off-board)
        assert!(!is_pawn_move(8, 15, true)); // 15 is h2, not a valid left-capture from a2

        // Pawn at b2 (1,1) = index 9 can capture both sides:
        assert!(is_pawn_move(9, 16, true)); // capture left -> a3
        assert!(is_pawn_move(9, 18, true)); // capture right -> c3
    }

    #[test]
    fn test_pawn_moves_black() {
        // Black pawn at a7 (0,6) = index 48
        assert!(is_pawn_move(48, 40, false)); // single step forward -> a6
        assert!(is_pawn_move(48, 32, false)); // double step from start -> a5
        assert!(!is_pawn_move(48, 24, false)); // too far
        assert!(is_pawn_move(48, 41, false)); // capture diagonal right -> b6

        // a7 cannot capture "left" (off-board)
        assert!(!is_pawn_move(48, 47, false)); // 47 is h7, not a valid left-capture from a7

        // Pawn at b7 (1,6) = index 49 can capture both sides:
        assert!(is_pawn_move(49, 40, false)); // capture left -> a6
        assert!(is_pawn_move(49, 42, false)); // capture right -> c6
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
        // Knight at (1,0) = square 1
        assert!(is_knight_move(1, 16)); // two up, one left
        assert!(is_knight_move(1, 18)); // two up, one right
        assert!(!is_knight_move(1, 2)); // invalid
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
