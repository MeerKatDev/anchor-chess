"use client";

import { useState } from "react";
import { web3, BN } from "@coral-xyz/anchor";
import { useBoardState } from "./useBoardState";
import { useAnchorProgram } from "./useAnchorProgram";
import { initializeBoard, joinBoard, movePiece } from "../instructions";

export default function useChessApp() {
  const { boardState, setBoardState } = useBoardState();
  const { wallet, getProgram } = useAnchorProgram();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [boardPda, setBoardPda] = useState<web3.PublicKey | null>(null);
  const [seed] = useState(() => new BN(Date.now()));
  const [joinInput, setJoinInput] = useState(""); // NEW input value

  const publicKey = wallet.publicKey ?? null;

  const handleCreateBoard = async () => {
    if (!publicKey) return;
    try {
      const program = await getProgram();
      setLoading(true);
      setStatus("Creating board...");
      const { signature, board, successful } = await initializeBoard(
        program,
        publicKey,
        seed,
        null
      );
      if(successful) {
        console.log("Board created Tx:", signature);
        console.log("Board created addr:", board.toBase58());
        console.log("Board created:", board);
        setBoardPda(board);
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

  const handleLoadBoard = async () => {
    if (!publicKey) return;
    
    if (!joinInput) {
      setStatus("Please paste a board PDA address.");
      return;
    }

    try {
      const program = await getProgram();
      setLoading(true);
      setStatus("Loading board...");

      const boardPda = new web3.PublicKey(joinInput); // parse from input
      const boardData = await program.account.board.fetch(boardPda);
      console.log("BoardState", boardData.state);
      console.log("BoardTurn", boardData.isWhiteTurn);
      setBoardState(boardData.state);
      setStatus("Board loaded from chain ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error loading board ❌");
    } finally {
      setLoading(false);
    }

  }

  const handleJoinBoard = async () => {
    if (!publicKey) return;
    
    if (!joinInput) {
      setStatus("Please paste a board PDA address.");
      return;
    }

    try {
      const program = await getProgram();
      setLoading(true);
      setStatus("Joining board...");

      const boardPda = new web3.PublicKey(joinInput); // parse from input
      const boardData = await program.account.board.fetch(boardPda);
      console.log("Board PDA", boardPda);
      console.log("Board on-chain:", boardData);
      const signature = await joinBoard(program, boardData.maker, publicKey, boardPda);
      console.log("Joined board publicKey:", publicKey);
      console.log("Joined board:", signature);
      console.log("Board after joining", await program.account.board.fetch(boardPda));
      setStatus("Joined board ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error joining board ❌");
    } finally {
      setLoading(false);
    }
  };


  const handleMovePiece = async (pieceIdxInverted: number, destinationInverted: number) => {
    const pieceIdx = 32 - pieceIdxInverted - 1;
    const destination = 64 + 1 - destinationInverted;
    // public Key is player, not always the maker
    if (!publicKey) return;
    try {
      const program = await getProgram();
      setLoading(true);
      setStatus(`Moving piece ${pieceIdx} to ${destination}...`);
      const boardPda = new web3.PublicKey(joinInput); // parse from input


      const boardData = await program.account.board.fetch(boardPda);
      console.log("pieceIdx", pieceIdx, "destination", destination, "currentPos", boardData.state[pieceIdx]);
      const signature = await movePiece(program, publicKey, publicKey, boardPda, pieceIdx, destination);

      console.log("Piece moved:", signature);
      setStatus("Move successful ✅");

      // Update board state locally (optional)
      setBoardState(prev => {
        const newState = [...prev];
        console.log("pieceIdx involved", pieceIdx);
        console.log("Prev board state", newState);
        newState[pieceIdx] = destination;
        console.log("Setting board state", newState);
        return newState;
      });
    } catch (err) {
      console.error(err);
      setStatus("Error moving piece ❌");
    } finally {
      setLoading(false);
    }
  };

  const isMoveValid = (_pieceIdx, _destination) => {
    return true;
  }

  return {
    boardState,
    setBoardState,
    boardPda,
    status,
    loading,
    handleCreateBoard,
    handleLoadBoard,
    handleJoinBoard,
    handleMovePiece,
    isMoveValid,
    publicKey,
    joinInput,
    setJoinInput,
  };
}
