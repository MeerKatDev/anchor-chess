import { useState } from "react";
import { web3 } from "@coral-xyz/anchor";

// Mirror of the Rust struct `Board`
// without bump and seed and maker at the beginning
export interface Board {
  isWhiteTurn: boolean;
  maker: web3.PublicKey | null;
  guest: web3.PublicKey | null; // Option<Pubkey>
  state: number[]; // 32 entries, 1-based positions
}

export default function useBoardState() {
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
