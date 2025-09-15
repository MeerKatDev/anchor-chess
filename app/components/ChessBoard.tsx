import { useState, Fragment } from "react";
import PieceRenderer from "./PieceRenderer";
import ChessBoardDialog from "./ChessBoardDialog";
import { Board } from "../hooks/useBoardState";

interface ChessBoardProps {
  board: Board;
  isMyTurn: boolean;
  onMoveAttempt: (pieceIdx: number, destination: number) => void;
  validateMove?: (pieceIdx: number, destination: number) => boolean;
}

export default function ChessBoard({
  board,
  isMyTurn,
  onMoveAttempt,
  validateMove,
}: ChessBoardProps) {
  const boardActive = board?.maker != null;
  const [selected, setSelected] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [proposedMove, setProposedMove] = useState<{
    pieceIdx: number;
    destination: number;
  } | null>(null);

  const handleSquareClick = (squareIdx: number) => {
    const pieceAtSquare = board.state.findIndex((pos) => pos === squareIdx + 1);

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

      // if clicked same piece again → unselect
      if (pieceAtSquare === pieceIdx) {
        setSelected(null);
        return;
      }

      // if invalid, unselect and return
      if (validateMove && !validateMove(pieceIdx, destination)) {
        console.log("Invalid move!");
        setSelected(null);
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

  const boardSquares = Array(64).fill(null);
  console.log("board", board);
  board?.state.forEach((position, pieceIdx) => {
    // position is the factual position on the board
    // pieceIdx is the type of piece
    // console.log("(position, pieceIdx)", position, pieceIdx);
    boardSquares[position - 1] = pieceIdx; // positions are 1..64
  });

  const turnIndicator = () => {
    const InactiveMessage = (
      <div className="text-gray-500 italic">Board is inactive.</div>
    );
    const MyMoveMessage = (
      <div className="text-gray-500 italic">It's your turn.</div>
    );
    const OpponentMoveMessage = (
      <div className="text-gray-500 italic">It's the opponent turn.</div>
    );
    return (
      (boardActive && ((isMyTurn && MyMoveMessage) || OpponentMoveMessage)) ||
      InactiveMessage
    );
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  const dialogMessage = (() => {
    if (!proposedMove) return;
    if (!board) return;

    const fromPos = squareToCoord(board.state[proposedMove.pieceIdx]);
    const toPos = squareToCoord(proposedMove.destination);

    return `Are you sure you want to move the piece from ${fromPos} to ${toPos}?`;
  })();

  return (
    <>
      {" "}
      {turnIndicator()}
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
              <div className="w-12 h-12 flex items-center justify-center font-bold text-gray-700">
                {rank}
              </div>

              {/* Squares */}
              {Array.from({ length: 8 }).map((_, col) => {
                const squareIdx = row * 8 + col;
                const isDark = (row + col) % 2 === 1;
                const renderSquareIdx = 63 - squareIdx;

                const piecePosition = boardSquares[renderSquareIdx];
                const isSelected =
                  piecePosition !== null && selected === piecePosition;
                const selectedClass = isSelected
                  ? "bg-yellow-400"
                  : isDark
                  ? "bg-green-800"
                  : "bg-green-500";

                return (
                  <div
                    key={col}
                    onClick={() => handleSquareClick(renderSquareIdx)}
                    className={`w-12 h-12 flex items-center justify-center cursor-pointer ${selectedClass}`}
                  >
                    <PieceRenderer
                      pieceIdx={piecePosition}
                      boardActive={boardActive}
                    />
                  </div>
                );
              })}
            </Fragment>
          );
        })}

        {/* Bottom-left empty corner */}
        <div></div>

        {/* Files A-H at bottom */}
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((f) => (
          <div
            key={f}
            className="w-12 h-12 flex items-center justify-center font-bold text-gray-700"
          >
            {f}
          </div>
        ))}
      </div>
      {/* Confirmation Modal */}
      <ChessBoardDialog
        modalOpen={modalOpen}
        confirmMove={confirmMove}
        cancelMove={cancelMove}
        message={dialogMessage}
      />
    </>
  );
}
