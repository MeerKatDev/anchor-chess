import {
  FaChessPawn,
  FaChessKing,
  FaChessQueen,
  FaChessRook,
  FaChessKnight,
  FaChessBishop,
} from "react-icons/fa";

export default function PieceRenderer({
  pieceIdx,
  boardActive,
}: {
  pieceIdx: number | null;
  boardActive: boolean;
}) {
  if (!boardActive) return null;
  if (pieceIdx === null) return null;

  // white back rank
  switch (pieceIdx) {
    case 0:
    case 7:
      return <FaChessRook className="text-white" />;
    case 1:
    case 6:
      return <FaChessKnight className="text-white" />;
    case 2:
    case 5:
      return <FaChessBishop className="text-white" />;
    case 3:
      return <FaChessQueen className="text-white" />;
    case 4:
      return <FaChessKing className="text-white" />;
  }

  // white pawns
  if (pieceIdx > 7 && pieceIdx < 16)
    return <FaChessPawn className="text-white" />;

  // black pawns
  if (pieceIdx > 15 && pieceIdx < 24)
    return <FaChessPawn className="text-black" />;

  // black back rank
  switch (pieceIdx) {
    case 24:
    case 31:
      return <FaChessRook className="text-black" />;
    case 25:
    case 30:
      return <FaChessKnight className="text-black" />;
    case 26:
    case 29:
      return <FaChessBishop className="text-black" />;
    case 27:
      return <FaChessQueen className="text-black" />;
    case 28:
      return <FaChessKing className="text-black" />;
  }
  return null;
}
