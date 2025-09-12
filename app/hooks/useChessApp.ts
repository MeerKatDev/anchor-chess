"use client";

import { useState } from "react";
import { web3, BN } from "@coral-xyz/anchor";
import { useBoardState } from "./useBoardState";
import { useAnchorProgram } from "./useAnchorProgram";
import { initializeBoard, joinBoard } from "../instructions";

export default function useChessApp() {
  const { boardState, setBoardState } = useBoardState();
  const { wallet, getProgram } = useAnchorProgram();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [boardPda, setBoardPda] = useState<web3.PublicKey | null>(null);
  const [seed] = useState(() => new BN(Date.now()));

  const publicKey = wallet.publicKey ?? null;

  const handleCreateBoard = async () => {
    if (!publicKey) return;
    try {
      const program = await getProgram();
      setLoading(true);
      setStatus("Creating board...");
      const { signature, boardPda } = await initializeBoard(
        program,
        publicKey,
        seed,
        null
      );
      console.log("Board created:", signature, boardPda.toBase58());
      setBoardPda(boardPda);
      setStatus("Board created successfully ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error creating board ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBoard = async () => {
    if (!publicKey) return;
    try {
      const program = await getProgram();
      setLoading(true);
      setStatus("Joining board...");
      const sig = await joinBoard(program, publicKey, seed, publicKey);
      console.log("Joined board:", sig);
      setStatus("Joined board ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error joining board ❌");
    } finally {
      setLoading(false);
    }
  };

  return {
    boardState,
    setBoardState,
    status,
    loading,
    handleCreateBoard,
    handleJoinBoard,
    publicKey,
  };
}
