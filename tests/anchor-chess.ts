import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorChess } from "../target/types/anchor_chess";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import BN from "bn.js";

describe("Minimal chess game example", () => {
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
      .accountsStrict({
        maker: maker.publicKey,
        board: boardPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Initialize tx:", tx);

    const board = await program.account.board.fetch(boardPda);
    console.log("Board guest:", board.guest?.toBase58());
    assert.equal(
      board.isWhiteTurn,
      true,
      "Board should start with white's turn"
    );
  });

  it("Guest joins the board", async () => {
    const tx = await program.methods
      .join(guest.publicKey)
      .accountsStrict({
        maker: maker.publicKey,
        board: boardPda,
        guest: guest.publicKey,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Join tx:", tx);

    const board = await program.account.board.fetch(boardPda);
    console.log("Board guest pubkey:", board.guest?.toBase58());
  });

  it("Makes a legal move", async () => {
    // Example: white pawn from index 8 (a2) to 16 (a3)
    /*
     *  3 | X . . .    <- destination: a3
     *  2 | P . . .    <- origin: a2
     *  1 | . . . .
     *      a b c d
     */
    // index indicating the piece type - doesn't change throughout the game
    const pieceIdx = 8;
    // place on the board - changes throughout the game
    const destination = 17;

    const tx = await program.methods
      .movePiece(pieceIdx, destination)
      .accountsStrict({
        player: maker.publicKey,
        board: boardPda,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Move piece tx:", tx);

    const board = await program.account.board.fetch(boardPda);
    assert.equal(
      destination,
      board.state[pieceIdx],
      "New position should be fetched!"
    );
    assert.equal(
      board.isWhiteTurn,
      false,
      "Board should start with white's turn and then change"
    );
  });

  it("Resigns the game", async () => {
    const tx = await program.methods
      .resign()
      .accountsStrict({
        player: maker.publicKey,
        board: boardPda,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Resign tx:", tx);
  });

  it("Closes the board account", async () => {
    const tx = await program.methods
      .close()
      .accountsStrict({
        maker: maker.publicKey,
        board: boardPda,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Close board tx:", tx);

    // Fetching the board now should fail
    try {
      await program.account.board.fetch(boardPda);
    } catch (err) {
      console.log("Board account successfully closed:", err.toString());
    }
  });
});
