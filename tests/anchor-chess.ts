import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorChess } from "../target/types/anchor_chess";
import BN from "bn.js";

describe("anchor-chess", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorChess as Program<AnchorChess>;
  let maker = provider.wallet as anchor.Wallet;

  it("Is initialized!", async () => {
  
    const seed = new BN(12345);

    const [boardPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("board"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8) 
      ],
      program.programId
    );
    
    const tx = await program.methods
      .initialize(seed, null)
      .accounts({
        maker: maker.publicKey,
        board: boardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", tx);
  });
});
