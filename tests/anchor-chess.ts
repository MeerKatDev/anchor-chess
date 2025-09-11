import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorChess } from "../target/types/anchor_chess";
import BN from "bn.js";

describe("anchor-chess", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorChess as Program<AnchorChess>;
  const maker = (program.provider as anchor.AnchorProvider).wallet.publicKey;

  it("Is initialized!", async () => {
  
    const seed = new BN(12345);

    // Derive PDA the same way as in #[account(...)]
    const [boardPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("board"),
        maker.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8), // u64 little-endian
      ],
      program.programId
    );
    
    const tx = await program.methods
      .initialize(null, seed)
      .accounts({
        maker,
        board: boardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
