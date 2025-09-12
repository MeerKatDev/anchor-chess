import ChessBoard from "./ChessBoard";
import useChessApp from "./hooks/useChessApp";
import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function ChessApp() {
  const {
    boardState,
    status,
    loading,
    handleCreateBoard,
    handleJoinBoard,
    publicKey,
  } = useChessApp();

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <WalletMultiButtonDynamic className="!bg-blue-600 hover:!bg-blue-700 !rounded-xl" />

      {status && <div className="text-gray-700">{status}</div>}

      <ChessBoard state={boardState} />

      <div className="flex gap-4">
        <button
          onClick={handleCreateBoard}
          disabled={!publicKey || loading}
          className={`px-4 py-2 rounded-xl text-white ${
            publicKey
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Create Board
        </button>
        <button
          onClick={handleJoinBoard}
          disabled={!publicKey || loading}
          className={`px-4 py-2 rounded-xl text-white ${
            publicKey
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Join Board
        </button>
      </div>
    </div>
  );
}
