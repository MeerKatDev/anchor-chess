import {
  FaChessPawn,
  FaChessKing,
  FaChessQueen,
  FaChessRook,
  FaChessKnight,
  FaChessBishop,
} from "react-icons/fa";

// --- Chess Board Component ---
export default function ChessBoard({ state }: { state: (string | null)[] }) {
  return (
    <div className="grid grid-cols-8 w-96 h-96 border-4 border-gray-700 rounded-xl overflow-hidden">
      {Array.from({ length: 64 }).map((_, i) => {
        const x = i % 8;
        const y = Math.floor(i / 8);
        const isDark = (x + y) % 2 === 1;
        const piece = state[i];

        return (
          <div
            key={i}
            className={`flex items-center justify-center ${
              isDark ? "bg-green-700" : "bg-green-200"
            }`}
          >
            {piece === "P" && <FaChessPawn className="text-black text-2xl" />}
            {piece === "p" && <FaChessPawn className="text-white text-2xl" />}
            {piece === "R" && <FaChessRook className="text-black text-2xl" />}
            {piece === "r" && <FaChessRook className="text-white text-2xl" />}
            {piece === "N" && <FaChessKnight className="text-black text-2xl" />}
            {piece === "n" && <FaChessKnight className="text-white text-2xl" />}
            {piece === "B" && <FaChessBishop className="text-black text-2xl" />}
            {piece === "b" && <FaChessBishop className="text-white text-2xl" />}
            {piece === "Q" && <FaChessQueen className="text-black text-2xl" />}
            {piece === "q" && <FaChessQueen className="text-white text-2xl" />}
            {piece === "K" && <FaChessKing className="text-black text-2xl" />}
            {piece === "k" && <FaChessKing className="text-white text-2xl" />}
          </div>
        );
      })}
    </div>
  );
}
