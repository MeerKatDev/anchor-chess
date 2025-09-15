import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import idl from "../../target/idl/anchor_chess.json";
import { AnchorChess } from "../../target/types/anchor_chess";

export default function useAnchorProgram() {
  const wallet = useWallet();
  const connection = new web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  function getProgram(): Program<AnchorChess> {
    if (!wallet) throw new Error("Wallet not connected");
    const provider = new AnchorProvider(connection, wallet, {});
    return new Program(idl as AnchorChess, provider);
  }

  return { wallet, getProgram };
}
