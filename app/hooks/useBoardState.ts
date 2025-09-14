import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";

// Mirror of the Rust struct `Board`
// without bump and seed and maker at the beginning
export interface Board {
  isWhiteTurn: boolean;
  maker: PublicKey | null;
  guest: PublicKey | null; // Option<Pubkey>
  state: number[]; // 32 entries, 1-based positions
}

export function useBoardState() {
  const [boardState, setBoardState] = useState<Board>(() => {
    const state = Array(32).fill(0);

    for (let i = 0; i < 16; i++) state[i] = i + 1;
    for (let i = 16; i < 32; i++) state[i] = 49 + (i - 16);

    return {
      isWhiteTurn: true,
      maker: null,
      guest: null,
      state,
    };
  });

  return { boardState, setBoardState };
}
