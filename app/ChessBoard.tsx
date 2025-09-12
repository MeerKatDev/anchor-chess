"use client";

import {
  FaChessPawn,
  FaChessKing,
  FaChessQueen,
  FaChessRook,
  FaChessKnight,
  FaChessBishop,
} from "react-icons/fa";
import { useState, Fragment } from "react";
import { Dialog } from "@headlessui/react";

interface ChessBoardProps {
  boardState: number[];
  isWhiteTurn: boolean;
  onMoveAttempt: (pieceIdx: number, destination: number) => void;
  validateMove?: (pieceIdx: number, destination: number) => boolean;
}

export default function ChessBoard({
  boardState,
  isWhiteTurn,
  onMoveAttempt,
  validateMove,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [proposedMove, setProposedMove] = useState<{ pieceIdx: number; destination: number } | null>(null);

  const handleSquareClick = (squareIdx: number) => {
    const pieceAtSquare = boardState.findIndex(pos => pos === squareIdx + 1);

    if (selected === null) {
      // select a piece
      if (pieceAtSquare === -1) return; // no piece here
      setSelected(pieceAtSquare);
    } else {
      const pieceIdx = selected;
      const destination = squareIdx + 1; // 1..64

      if (validateMove && !validateMove(pieceIdx, destination)) {
        setSelected(null);
        return;
      }

      setProposedMove({ pieceIdx, destination });
      setModalOpen(true);
    }
  };

  const confirmMove = () => {
    if (proposedMove) {
      onMoveAttempt(proposedMove.pieceIdx, proposedMove.destination);
    }
    setSelected(null);
    setProposedMove(null);
    setModalOpen(false);
  };

  const cancelMove = () => {
    setSelected(null);
    setProposedMove(null);
    setModalOpen(false);
  };

  // const squareToCoord = (square: number): string => {
  //   const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  //   const rank = Math.floor(square / 8) + 1;
  //   const file = files[square % 8];
  //   return `${file}${rank}`;
  // };

  const squareToCoord = (position: number | undefined): string => {
    if (!position) return "";
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const zeroIdx = position - 1; // 0..63
    const row = Math.floor(zeroIdx / 8); // 0 = top
    const col = zeroIdx % 8;
    const file = files[col];
    const rank = 8 - row; // top row = 8, bottom row = 1
    return `${file}${rank}`;
  };

  const getPiecePosition = (pieceIdx: number, boardState: number[]): number => {
    return boardState[pieceIdx];
  }

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  const boardSquares = Array(64).fill(null);
  boardState.forEach((pos, pieceIdx) => {
    boardSquares[pos - 1] = pieceIdx; // positions are 1..64
  });

  return (
    <>
      <div className="inline-grid grid-rows-9 grid-cols-9">
        {/* Top-left empty corner */}
        <div></div>

        {/* Top empty cells for alignment */}
        {Array.from({ length: 8 }).map((_, col) => (
          <div key={col}></div>
        ))}

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, row) => {
          const rank = 8 - row;
          return (
            <Fragment key={rank}>
              {/* Rank number on left */}
              <div className="w-12 h-12 flex items-center justify-center font-bold text-gray-700">{rank}</div>

              {/* Squares */}
              {Array.from({ length: 8 }).map((_, col) => {
                const squareIdx = row * 8 + col;
                const isDark = (row + col) % 2 === 1;
                // const boardSquares = Array(64).fill(null);
                // boardState.forEach((pos, pieceIdx) => {
                //   boardSquares[pos - 1] = pieceIdx; // positions are 1..64
                // });
                const pieceIdx = boardSquares[squareIdx];
                const isSelected = pieceIdx !== null && selected === pieceIdx;
                const selectedClass = isSelected ? "bg-yellow-400" : isDark ? "bg-green-700" : "bg-green-200";

                return (
                  <div
                    key={col}
                    onClick={() => handleSquareClick(squareIdx)}
                    className={`w-12 h-12 flex items-center justify-center cursor-pointer ${selectedClass}`}
                  >
                    <PieceRenderer squareIdx={pieceIdx} />
                  </div>
                );
              })}
            </Fragment>
          );
        })}

        {/* Bottom-left empty corner */}
        <div></div>

        {/* Files A-H at bottom */}
        {["a","b","c","d","e","f","g","h"].map((f) => (
          <div key={f} className="w-12 h-12 flex items-center justify-center font-bold text-gray-700">
            {f}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={modalOpen} onClose={cancelMove} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-xl">
          <Dialog.Title className="text-lg font-bold">Confirm Move</Dialog.Title>
          <Dialog.Description className="mt-2 mb-4">
            Are you sure you want to move piece from {squareToCoord(getPiecePosition(proposedMove?.pieceIdx, boardState))} to {squareToCoord(proposedMove?.destination)}?
          </Dialog.Description>
          <div className="flex gap-4 justify-end">
            <button onClick={confirmMove} className="bg-green-600 text-white px-4 py-2 rounded-xl">
              Confirm
            </button>
            <button onClick={cancelMove} className="bg-red-600 text-white px-4 py-2 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function PieceRenderer({ squareIdx }: { squareIdx: number | null }) {
  if (squareIdx === null) return null;

  if (squareIdx < 8) {
    return <FaChessPawn className="text-black" />;
  }
  if (squareIdx < 16) {
    switch (squareIdx) {
      case 8: case 15: return <FaChessRook className="text-black" />;
      case 9: case 14: return <FaChessKnight className="text-black" />;
      case 10: case 13: return <FaChessBishop className="text-black" />;
      case 11: return <FaChessQueen className="text-black" />;
      case 12: return <FaChessKing className="text-black" />;
    }
  }
  if (squareIdx < 24) return <FaChessPawn className="text-white" />;
  // white back rank
  const bIdx = squareIdx - 24;
  switch (bIdx) {
    case 0: case 7: return <FaChessRook className="text-white" />;
    case 1: case 6: return <FaChessKnight className="text-white" />;
    case 2: case 5: return <FaChessBishop className="text-white" />;
    case 3: return <FaChessQueen className="text-white" />;
    case 4: return <FaChessKing className="text-white" />;
  }
  return null;
}


