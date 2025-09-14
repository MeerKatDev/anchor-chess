import ChessBoard from "./ChessBoard";
import dynamic from "next/dynamic";
import { use, useState, useEffect } from "react";
import { web3 } from "@coral-xyz/anchor";
import useAnchorProgram from "./hooks/useAnchorProgram";
import { isMoveValid } from "./native";
import { movePiece } from "./instructions";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface PdaBoardProps {
  searchParams: Promise<{ pda?: string }>;
}

export default function PdaBoard({ searchParams }: PdaBoardProps) {
  const { wallet, getProgram } = useAnchorProgram();
  const [boardState, setBoardState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const params = use(searchParams);
  const pda = params.pda;

  const handleMovePiece = async (
    pieceIdxInverted: number,
    destinationInverted: number
  ) => {
    const pieceIdx = 32 - pieceIdxInverted - 1;
    const destination = 64 + 1 - destinationInverted;
    // public Key is player, not always the maker
    const publicKey = wallet.publicKey;
    if (!publicKey) return;
    try {
      const program = getProgram();
      setLoading(true);
      setStatus(`Moving piece ${pieceIdx} to ${destination}...`);
      const boardPda = new web3.PublicKey(pda); // parse from input

      const boardData = await program.account.board.fetch(boardPda);
      console.log(
        "pieceIdx",
        pieceIdx,
        "destination",
        destination,
        "currentPos",
        boardData.state[pieceIdx]
      );
      const signature = await movePiece(
        program,
        publicKey,
        boardData.maker,
        boardPda,
        pieceIdx,
        destination
      );

      console.log("Piece moved:", signature);
      const { isWhiteTurn, maker, guest, state } =
        await program.account.board.fetch(boardPda);
      const onchainBoardState = { isWhiteTurn, maker, guest, state };
      setBoardState(onchainBoardState);
      setStatus("Move successful ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error moving piece ❌");
    } finally {
      setLoading(false);
    }
  };

  const isMyTurn =
    boardState?.maker &&
    wallet?.publicKey &&
    wallet.publicKey.toBase58() === boardState.maker.toBase58();

  useEffect(() => {
    if (!wallet?.publicKey) return;

    const fetchBoard = async () => {
      try {
        const program = getProgram();
        const boardPda = new web3.PublicKey(pda);
        const board = await program.account.board.fetch(boardPda);
        setBoardState(board);
      } catch (err) {
        console.error("Failed to fetch board:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [pda, wallet?.publicKey]);

  return (
    <>
      <WalletMultiButtonDynamic className="!bg-blue-600 hover:!bg-blue-700 !rounded-xl" />

      {status && <div className="text-gray-700">{status}</div>}

      <ChessBoard
        board={boardState}
        isMyTurn={isMyTurn}
        onMoveAttempt={handleMovePiece}
        validateMove={isMoveValid}
      />
    </>
  );
}
