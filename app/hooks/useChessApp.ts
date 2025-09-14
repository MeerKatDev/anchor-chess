"use client";

import { useState } from "react";
import { web3, BN } from "@coral-xyz/anchor";
import { useBoardState, Board } from "./useBoardState";
import { useAnchorProgram } from "./useAnchorProgram";
import { initializeBoard, joinBoard, movePiece } from "../instructions";

export default function useChessApp() {
  const { wallet, getProgram } = useAnchorProgram();
  const { boardState, setBoardState } = useBoardState();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [boardPda, setBoardPda] = useState<web3.PublicKey | null>(null);
  const [joinInput, setJoinInput] = useState("");

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
      if(successful) {
        console.log("Board created Tx:", signature);
        console.log("Board created addr:", board.toBase58());
        console.log("Board created:", board);

        // no need to reload the whole state
        // loadBoardStateFromChain(board);
        boardState.maker = publicKey;
        setBoardState(boardState);

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
    const publicKey = wallet.publicKey;
    if (!publicKey) return;
    
    if (joinInput !== null) {
      setStatus("Please paste a board PDA address.");
      return;
    }

    try {
      const program = getProgram();
      setLoading(true);
      setStatus("Loading board...");
      const boardPda = new web3.PublicKey(joinInput); // parse from input
      loadBoardStateFromChain(boardPda);
      setBoardPda(boardPda);
      setStatus("Board loaded from chain ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error loading board ❌");
    } finally {
      setLoading(false);
    }

  }

  const handleJoinBoard = async () => {
    const publicKey = wallet.publicKey;
    if (!publicKey) return;
    
    if (joinInput !== null) {
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
      const signature = await joinBoard(program, boardData.maker, publicKey, boardPda);
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
    const publicKey = wallet.publicKey;
    if (!publicKey) return;
    try {
      const program = await getProgram();
      setLoading(true);
      setStatus(`Moving piece ${pieceIdx} to ${destination}...`);
      const boardPda = new web3.PublicKey(joinInput); // parse from input

      const boardData = await program.account.board.fetch(boardPda);
      console.log("pieceIdx", pieceIdx, "destination", destination, "currentPos", boardData.state[pieceIdx]);
      const signature = await movePiece(program, publicKey, boardData.maker, boardPda, pieceIdx, destination);

      console.log("Piece moved:", signature);
      loadBoardStateFromChain(boardPda);
      setStatus("Move successful ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error moving piece ❌");
    } finally {
      setLoading(false);
    }
  };

  const loadBoardStateFromChain = async (boardPda: PublicKey) => {
    console.log("Calling `loadBoardStateFromChain` ...");
    const { isWhiteTurn, maker, guest, state } = await program.account.board.fetch(boardPda);
    console.log("Board State", state);
    console.log("Board isWhiteTurn", isWhiteTurn);
    const onchainBoardState: Board = { isWhiteTurn, maker, guest, state };
    setBoardState(onchainBoardState);
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
    wallet,
    joinInput,
    setJoinInput,
  };
}
