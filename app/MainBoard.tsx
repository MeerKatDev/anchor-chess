import ChessBoard from "./ChessBoard";
import dynamic from "next/dynamic";
import useChessApp from "./hooks/useChessApp";
import { isMoveValid } from "./native";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function MainBoard() {
	const {
	  boardState,
	  setBoardState,
	  boardPda,
	  status,
	  loading,
	  handleCreateBoard,
	  handleLoadBoard,
	  handleJoinBoard,
	  handleMovePiece,
	  wallet,
	  joinInput,
	  setJoinInput,
	} = useChessApp();

	const canJoinOrLoad = !!wallet.publicKey && !!joinInput;
	const isMyTurn = boardState?.maker && wallet?.publicKey && (wallet.publicKey.toBase58() === boardState.maker.toBase58());

	return (
		<>
		<WalletMultiButtonDynamic className="!bg-blue-600 hover:!bg-blue-700 !rounded-xl" />

		{status && <div className="text-gray-700">{status}</div>}

		{/* Display PDA (creator sees it) */}
		<input
		  type="text"
		  value={boardPda?.toBase58() ?? ""}
		  readOnly
		  placeholder="Board PDA will appear here"
		  className={`border px-2 py-1 w-80 text-center ${
		    boardPda ? "border-gray-400 text-black" : "border-gray-300 text-gray-400"
		  }`}
		/>

		{/* Input for joining (other player pastes it) */}
		<input
		  type="text"
		  value={joinInput}
		  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
		    setJoinInput(e.target.value)
		  }
		  placeholder="Paste board PDA to join"
		  className="border border-gray-400 px-2 py-1 w-80 text-center"
		/>

		<ChessBoard 
		  board={boardState} 
		  isMyTurn={isMyTurn}
		  onMoveAttempt={handleMovePiece}
		  validateMove={isMoveValid} 
		/>

		<div className="flex gap-4">
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
		  <button
		    onClick={handleJoinBoard}
		    disabled={!canJoinOrLoad || loading}
		    className={`px-4 py-2 rounded-xl text-white ${
		      canJoinOrLoad
		        ? "bg-green-600 hover:bg-green-700"
		        : "bg-gray-400 cursor-not-allowed"
		    }`}
		  >
		    Join Board
		  </button>
		  <button
		    onClick={handleLoadBoard}
		    disabled={!canJoinOrLoad || loading}
		    className={`px-4 py-2 rounded-xl text-white ${
		      canJoinOrLoad
		        ? "bg-green-600 hover:bg-green-700"
		        : "bg-gray-400 cursor-not-allowed"
		    }`}
		  >
		    Load Board
		  </button>
		</div>
  </>
	);
}