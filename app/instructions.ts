import { Program, web3, BN } from "@coral-xyz/anchor";
import { AnchorChess } from "../target/types/anchor_chess";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

const systemProgram = web3.SystemProgram.programId;
const BOARD_SEED = Buffer.from("board");

// --- 1. Initialize board ---
export async function initializeBoard(
  program: Program<AnchorChess>,
  maker: web3.PublicKey,
  seed: BN,
  guest: web3.PublicKey | null
) {
  const [board] = web3.PublicKey.findProgramAddressSync(
    [BOARD_SEED, maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    const signature = await program.methods
      .initialize(seed, guest)
      .accountsStrict({ maker, board, systemProgram })
      .rpc();

    return { signature, board, successful: true };
  } catch (err) {
    if (err instanceof WalletSignTransactionError) {
      // This means the user rejected the signing prompt
      console.warn("WalletSignTransactionError:", err.message);
      return { signature: null, board, successful: false };
    }

    // Wallet reject errors vary depending on wallet/provider
    if (err?.message?.includes("User rejected") || err?.code === 4001) {
      console.warn("User rejected the transaction signing request.");
      return { signature: null, board, successful: false };
    }

    // Other errors (program error, insufficient funds, etc.)
    console.error("Transaction failed:", err);
    throw err;
  }
}

// --- 2. Guest joins board ---
export async function joinBoard(
  program: Program<AnchorChess>,
  maker: web3.PublicKey,
  guest: web3.PublicKey,
  board: web3.PublicKey // PDA
) {
  try {
    const signature = await program.methods
      .join(guest)
      .accountsStrict({ maker, board, guest })
      .rpc();

    return { signature, board, successful: true };
  } catch (err) {
    if (err instanceof WalletSignTransactionError) {
      // This means the user rejected the signing prompt
      console.warn("WalletSignTransactionError:", err.message);
      return { signature: null, board, successful: false };
    }

    // Wallet reject errors vary depending on wallet/provider
    if (err?.message?.includes("User rejected") || err?.code === 4001) {
      console.warn("User rejected the transaction signing request.");
      return { signature: null, board, successful: false };
    }

    // Other errors (program error, insufficient funds, etc.)
    console.error("Transaction failed:", err);
    throw err;
  }
}

// --- 3. Move a piece ---
export async function movePiece(
  program: Program<AnchorChess>,
  player: web3.PublicKey,
  maker: web3.PublicKey,
  board: web3.PublicKey,
  pieceIdx: number,
  destination: number
) {
  try {
    const signature = await program.methods
      .movePiece(pieceIdx, destination)
      .accountsStrict({ player, board })
      .rpc();

    return { signature, board, successful: true };
  } catch (err) {
    if (err instanceof WalletSignTransactionError) {
      // This means the user rejected the signing prompt
      console.warn("WalletSignTransactionError:", err.message);
      return { signature: null, board, successful: false };
    }

    // Other errors (program error, insufficient funds, etc.)
    console.error("Transaction failed:", err);
    throw err;
  }
}

// --- 4. Resign from game ---
export async function resignGame(
  program: Program<AnchorChess>,
  player: web3.PublicKey,
  board: web3.PublicKey
) {
  const signature = await program.methods
    .resign()
    .accountsStrict({ player, board })
    .rpc();

  return signature;
}

// --- 5. Close the board ---
export async function closeBoard(
  program: Program<AnchorChess>,
  maker: web3.PublicKey,
  board: web3.PublicKey
) {
  const signature = await program.methods
    .close()
    .accountsStrict({ maker, board })
    .rpc();

  return signature;
}
