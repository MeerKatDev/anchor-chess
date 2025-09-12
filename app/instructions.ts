import { Program, web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { AnchorChess } from "../target/types/anchor_chess";

// --- 1. Initialize board ---
export async function initializeBoard(
  program: Program<AnchorChess>,
  maker: web3.PublicKey,
  seed: BN,
  guest: PublicKey | null
) {
  const [boardPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("board"), maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const signature = await program.methods
    .initialize(seed, guest)
    .accountsStrict({
      maker,
      board: boardPda,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  return { signature, boardPda };
}

// --- 2. Guest joins board ---
export async function joinBoard(
  program: Program<AnchorChess>,
  maker: web3.PublicKey,
  seed: BN,
  guest: PublicKey
) {
  const [boardPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("board"), maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const signature = await program.methods
    .join(guest)
    .accountsStrict({
      maker,
      board: boardPda,
    })
    .rpc();

  return signature;
}

// --- 3. Move a piece ---
export async function movePiece(
  program: Program<AnchorChess>,
  player: web3.PublicKey,
  maker: web3.PublicKey,
  seed: BN,
  pieceIdx: number,
  destination: number
) {
  const [boardPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("board"), maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const signature = await program.methods
    .movePiece(pieceIdx, destination)
    .accountsStrict({
      player,
      board: boardPda,
    })
    .rpc();

  return signature;
}

// --- 4. Resign from game ---
export async function resignGame(
  program: Program<AnchorChess>,
  maker: web3.PublicKey,
  boardPda: web3.PublicKey
) {
  const signature = await program.methods
    .resign()
    .accountsStrict({
      maker,
      board: boardPda,
    })
    .rpc();

  return signature;
}

// --- 5. Close the board ---
export async function closeBoard(
  program: Program<AnchorChess>,
  payer: web3.PublicKey,
  maker: web3.PublicKey,
  seed: BN
) {
  const [boardPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("board"), maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const signature = await program.methods
    .close()
    .accountsStrict({
      payer,
      maker,
      board: boardPda,
    })
    .rpc();

  return signature;
}
