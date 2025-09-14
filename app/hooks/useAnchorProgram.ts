import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import idl from "../../target/idl/anchor_chess.json";
import { AnchorChess } from "../../target/types/anchor_chess";

export function useAnchorProgram() {
  const wallet = useWallet();
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  function getProgram(): Program<AnchorChess> {
    if (!wallet) throw new Error("Wallet not connected");
    const provider = new AnchorProvider(connection, wallet as any, {});
    return new Program(idl as AnchorChess, provider);
  }

  return { wallet, getProgram };
}
