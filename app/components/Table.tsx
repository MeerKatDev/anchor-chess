import ChessBoard from "./ChessBoard";
import dynamic from "next/dynamic";
import { use, useState, useEffect } from "react";
import { web3 } from "@coral-xyz/anchor";
import useAnchorProgram from "../hooks/useAnchorProgram";
import { isMoveValid } from "../native";
import { movePiece, closeBoard, resign } from "../instructions";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface Board {
  isWhiteTurn: boolean;
  gameOver: boolean;
  maker: web3.PublicKey;
  guest: web3.PublicKey;
  state: number[];
}

interface PdaBoardProps {
  searchParams: Promise<{ pda?: string }>;
}

export default function Table({ searchParams }: PdaBoardProps) {
  const { wallet, getProgram } = useAnchorProgram();
  const [boardState, setBoardState] = useState<Board>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const params = use(searchParams);
  const pda = params.pda;

  const handleCloseBoard = async (boardPda: PublicKey) => {
    if (!walletPubkey) return;
    try {
      const program = getProgram();
      setLoading(true);
      const signature = await closeBoard(program, walletPubkey, boardPda);
      if (signature) {
        console.log("Board closed successfully ✅");
      } else {
        console.log("Error closing board ❌");
      }
    } catch (err) {
      console.error(err);
      console.log("Error closing board ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleResign = async (boardPda: PublicKey) => {
    if (!walletPubkey) return;
    try {
      const program = getProgram();
      setLoading(true);
      const signature = await resign(program, walletPubkey, boardPda);
      if (signature) {
        console.log("Board closed successfully ✅");
      } else {
        console.log("Error closing board ❌");
      }
    } catch (err) {
      console.error(err);
      console.log("Error closing board ❌");
    } finally {
      setLoading(false);
    }
  };

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
      const { isWhiteTurn, maker, guest, state, gameOver } =
        await program.account.board.fetch(boardPda);
      const onchainBoardState = { isWhiteTurn, maker, guest, state, gameOver };
      setBoardState(onchainBoardState);
      setStatus("Move successful ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error moving piece ❌");
    } finally {
      setLoading(false);
    }
  };

  // TOFIX probably way too convoluted

  const isMakerWallet =
    boardState?.maker &&
    wallet?.publicKey &&
    wallet.publicKey.toBase58() === boardState.maker.toBase58();

  const isGuestTurn =
    !boardState?.isWhiteTurn &&
    boardState?.guest &&
    wallet?.publicKey &&
    wallet.publicKey.toBase58() === boardState.guest.toBase58();

  const isMyTurn = (isMakerWallet && boardState.isWhiteTurn) || isGuestTurn;

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
      <Link
        href="/"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <FaArrowLeft />
        <span>Go back to Tables</span>
      </Link>
      <WalletMultiButtonDynamic className="!bg-blue-600 hover:!bg-blue-700 !rounded-xl" />

      {status && <div className="text-gray-700">{status}</div>}

      <ChessBoard
        board={boardState}
        isMyTurn={isMyTurn}
        onMoveAttempt={handleMovePiece}
        validateMove={isMoveValid}
      />

      <div className="flex items-center gap-6">
        {isMakerWallet && (
          <button
            onClick={() => handleCloseBoard(pubkey)}
            disabled={!wallet?.publicKey || loading || !boardState.gameOver}
            className={`px-4 py-2 rounded-xl text-white ${
              wallet?.publicKey
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Close Board
          </button>
        )}

        <button
          onClick={() => handleResign(pubkey)}
          disabled={!wallet?.publicKey || loading}
          className={`px-4 py-2 rounded-xl text-white ${
            wallet?.publicKey
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Resign from game
        </button>
      </div>
    </>
  );
}
