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
  onMoveAttempt: (pieceIdx: number, destination: number) => void;
  validateMove?: (pieceIdx: number, destination: number) => boolean;
}

export default function ChessBoard({
  boardState,
  onMoveAttempt,
  validateMove,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [proposedMove, setProposedMove] = useState<{ pieceIdx: number; destination: number } | null>(null);

  const handleSquareClick = (squareIdx: number) => {
    const pieceAtSquare = boardState.findIndex(pos => pos === squareIdx + 1);

    console.log("squareIdx clicked: ", squareIdx);
    console.log("pieceAtSquare: ", pieceAtSquare);

    if (selected === null) {
      // select a piece
      if (pieceAtSquare === -1) return; // no piece here
      setSelected(pieceAtSquare);
    } else {
      const pieceIdx = selected;
      const destination = squareIdx + 1; // 1..64
      console.log("pieceIdx: ", pieceIdx);
      console.log("destination: ", destination);

      // if invalid, unselect and return
      if (validateMove && !validateMove(pieceIdx, destination)) {
        console.log("Invalid move!");
        return;
      }

      setProposedMove({ pieceIdx, destination });
      setModalOpen(true);
      setSelected(null);
    }
  };

  const confirmMove = () => {
    if (proposedMove) {
      console.log("Calling onMoveAttempt!");
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
  boardState.forEach((position, pieceIdx) => {
    // position is the factual position on the board
    // pieceIdx is the type of piece
    // console.log("(position, pieceIdx)", position, pieceIdx);
    boardSquares[position - 1] = pieceIdx; // positions are 1..64
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
                const renderSquareIdx = 63 - squareIdx;

                const piecePosition = boardSquares[renderSquareIdx];
                const isSelected = piecePosition !== null && selected === piecePosition;
                const selectedClass = isSelected ? "bg-yellow-400" : (isDark ? "bg-green-800" : "bg-green-500");

                return (
                  <div
                    key={col}
                    onClick={() => handleSquareClick(renderSquareIdx)}
                    className={`w-12 h-12 flex items-center justify-center cursor-pointer ${selectedClass}`}
                  >
                    <PieceRenderer pieceIdx={piecePosition} />
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

function PieceRenderer({ pieceIdx }: { pieceIdx: number | null }) {

  if (pieceIdx === null) return null;

  // white back rank
  switch (pieceIdx) {
    case 0: case 7: return <FaChessRook className="text-white" />;
    case 1: case 6: return <FaChessKnight className="text-white" />;
    case 2: case 5: return <FaChessBishop className="text-white" />;
    case 3: return <FaChessQueen className="text-white" />;
    case 4: return <FaChessKing className="text-white" />;
  }

  // white pawns
  if (pieceIdx > 7 && pieceIdx < 16)
    return <FaChessPawn className="text-white" />;
  

  // black pawns
  if (pieceIdx > 15 && pieceIdx < 24) 
    return <FaChessPawn className="text-black" />;

  // black back rank
  switch (pieceIdx) {
    case 24: case 31: return <FaChessRook className="text-black" />;
    case 25: case 30: return <FaChessKnight className="text-black" />;
    case 26: case 29: return <FaChessBishop className="text-black" />;
    case 27: return <FaChessQueen className="text-black" />;
    case 28: return <FaChessKing className="text-black" />;
  }
  return null;
}


