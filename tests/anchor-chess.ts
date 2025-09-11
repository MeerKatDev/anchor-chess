import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorChess } from "../target/types/anchor_chess";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

describe("Chess game lifetime example", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorChess as Program<AnchorChess>;
  const maker = provider.wallet as anchor.Wallet;

  // Create a guest wallet for testing
  const guest = Keypair.generate();

  // Seed for PDA derivation
  const seed = new BN(12345);

  // PDA for the board account
  const [boardPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("board"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  it("Initializes the board", async () => {
    const tx = await program.methods
      .initialize(seed, null)
      .accounts({
        maker: maker.publicKey,
        board: boardPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    const board = await program.account.board.fetch(boardPda);
    console.log("Board guest:", board.guest?.toBase58());
    console.log("Is white turn:", board.isWhiteTurn);
  });

  it("Guest joins the board", async () => {
    const tx = await program.methods
      .join(guest.publicKey)
      .accounts({
        maker: maker.publicKey,
        board: boardPda,
      })
      .rpc();

    console.log("Join tx:", tx);

    const board = await program.account.board.fetch(boardPda);
    console.log("Board guest pubkey:", board.guest?.toBase58());
  });

  it("Makes a legal move", async () => {
    // Example: white pawn from index 8 (a2) to 16 (a3)
    /*
        3 | D . . .    <- destination: a3
        2 | O . . .    <- origin: a2
        1 | . . . .
            a b c d
    */
    // index indicating the piece type - doesn't change throughout the game
    const pieceIdx = 8; 
    // place on the board - changes throughout the game
    const destination = 17;

    const tx = await program.methods
      .movePiece(pieceIdx, destination)
      .accounts({
        player: maker.publicKey,
        board: boardPda,
      })
      .rpc();

    console.log("Move piece tx:", tx);

    const board = await program.account.board.fetch(boardPda);
    console.log("Piece new position:", board.state[pieceIdx]);
    console.log("Is white turn:", board.isWhiteTurn);
  });

  it("Resigns the game", async () => {
    const tx = await program.methods
      .resign()
      .accounts({
        maker: maker.publicKey,
        board: boardPda,
      })
      .rpc();

    console.log("Resign tx:", tx);
  });

  it("Closes the board account", async () => {
    const tx = await program.methods
      .close()
      .accounts({
        payer: maker.publicKey,
        maker: maker.publicKey,
        board: boardPda,
      })
      .rpc();

    console.log("Close board tx:", tx);

    // Fetching the board now should fail
    try {
      await program.account.board.fetch(boardPda);
    } catch (err) {
      console.log("Board account successfully closed:", err.toString());
    }
  });
});
