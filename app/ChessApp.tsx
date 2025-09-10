import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { WalletError } from "@solana/wallet-adapter-base";
import dynamic from "next/dynamic";

import ChessBoard from "./ChessBoard";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

// --- App UI ---
export default function ChessApp() {
  const { publicKey } = useWallet();
  const [boardState, setBoardState] = useState<(string | null)[]>(
    Array(64).fill(null)
  );

  useEffect(() => {
    // Initial setup of pieces (simplified FEN-like)
    const initial = Array(64).fill(null);
    // Pawns
    for (let i = 8; i < 16; i++) initial[i] = "P";
    for (let i = 48; i < 56; i++) initial[i] = "p";
    // Back rank White
    initial[0] = "R";
    initial[7] = "R";
    initial[1] = "N";
    initial[6] = "N";
    initial[2] = "B";
    initial[5] = "B";
    initial[3] = "Q";
    initial[4] = "K";
    // Back rank Black
    initial[56] = "r";
    initial[63] = "r";
    initial[57] = "n";
    initial[62] = "n";
    initial[58] = "b";
    initial[61] = "b";
    initial[59] = "q";
    initial[60] = "k";

    setBoardState(initial);
  }, []);

  const handleCreateBoard = () => {
    console.log("Creating board...");
    // TODO: call Anchor `initialize` with wallet
  };

  const handleJoinBoard = () => {
    console.log("Joining board...");
    // TODO: call Anchor `join`
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Wallet connect button */}
      <WalletMultiButtonDynamic className="!bg-blue-600 hover:!bg-blue-700 !rounded-xl" />

      {/* Board */}
      <ChessBoard state={boardState} />

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleCreateBoard}
          disabled={!publicKey}
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
          disabled={!publicKey}
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
