import ChessBoard from "./ChessBoard";
import dynamic from "next/dynamic";
import useAnchorProgram from "./hooks/useAnchorProgram";
import { useState } from "react";
import { isMoveValid } from "./native";
import { useRouter } from "next/navigation";
import { initializeBoard, joinBoard } from "./instructions";
import { web3, BN } from "@coral-xyz/anchor";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function MainBoard() {
  const { wallet, getProgram } = useAnchorProgram();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [boardPda, setBoardPda] = useState<web3.PublicKey | null>(null);
  const [joinInput, setJoinInput] = useState("");

  const canJoinOrLoad = !!wallet.publicKey && !!joinInput;

  const router = useRouter();

  const handleCreateBoard = async () => {
    const publicKey = wallet.publicKey;

    if (!publicKey) return;
    try {
      const program = getProgram();
      setLoading(true);
      setStatus("Creating board...");
      const { signature, board, successful } = await initializeBoard(
        program,
        publicKey,
        new BN(Date.now()),
        null
      );
      if (successful) {
        router.push(`/table?pda=${board.toBase58()}`);
        setStatus("Board created successfully ✅");
      } else {
        setStatus("Error creating board ❌");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error creating board ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBoard = async () => {
    const publicKey = wallet.publicKey;
    if (!publicKey) return;

    if (joinInput) {
      setStatus("Please paste a board PDA address.");
      return;
    }

    try {
      const program = getProgram();
      setLoading(true);
      setStatus("Joining board...");

      const boardPda = new web3.PublicKey(joinInput);
      console.log("Getting board data from chain..");
      const boardData = await program.account.board.fetch(boardPda);
      console.log("Joining board..");
      const signature = await joinBoard(
        program,
        boardData.maker,
        publicKey,
        boardPda
      );
      setStatus("Joined board ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error joining board ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Chess board game on Solana</h2>
      <WalletMultiButtonDynamic className="!bg-blue-600 hover:!bg-blue-700 !rounded-xl" />

      <div>
        Chess board games. On the right, games that could be joined. Otherwise,
        you can create a new game with the button below.
      </div>
      <div>
        <button
          onClick={handleCreateBoard}
          disabled={!wallet.publicKey || loading}
          className={`px-4 py-2 rounded-xl text-white ${
            wallet.publicKey
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Create Board
        </button>
      </div>
      {/* Input for joining (other player pastes it) */}
      <div>
        <hr className="border mb-2" />
        <input
          type="text"
          value={joinInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setJoinInput(e.target.value)
          }
          placeholder="Paste board PDA to join"
          className="border border-gray-400 px-2 py-1 w-80 text-center"
        />
        <button
          onClick={handleJoinBoard}
          disabled={!canJoinOrLoad || loading}
          className={`px-4 py-2 rounded-xl text-white ml-4 ${
            canJoinOrLoad
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Join Board
        </button>
      </div>
    </>
  );
}
