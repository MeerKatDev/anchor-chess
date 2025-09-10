import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorChess } from "../target/types/anchor_chess";
import BN from "bn.js";

describe("anchor-chess", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorChess as Program<AnchorChess>;

  it("Is initialized!", async () => {
    // Add your test here.
    const seed = new BN(12345);
    const tx = await program.methods.initialize(null, seed).rpc();
    console.log("Your transaction signature", tx);
  });
});
