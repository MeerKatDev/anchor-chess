import { useState, useEffect } from "react";

export function useBoardState() {
  // 32 pieces: 0–15 white, 16–31 black
  const [boardState, setBoardState] = useState<number[]>(Array(32).fill(0));

  useEffect(() => {
    const initial = Array(32).fill(0);

    // --- White pieces ---
    // Pawns: a2..h2 -> squares 9..16
    for (let i = 0; i < 16; i++) initial[i] = i + 1;

    // Back rank: a1..h1
    // initial[8] = 1;  // Rook a1
    // initial[9] = 2;  // Knight b1
    // initial[10] = 3; // Bishop c1
    // initial[11] = 4; // Queen d1
    // initial[12] = 5; // King e1
    // initial[13] = 6; // Bishop f1
    // initial[14] = 7; // Knight g1
    // initial[15] = 8; // Rook h1

    // --- Black pieces ---
    // Pawns: a7..h7 -> squares 49..56
    for (let i = 16; i < 24; i++) initial[i] = 49 + (i - 16);

    // Back rank: a8..h8
    initial[24] = 57; // Rook a8
    initial[25] = 58; // Knight b8
    initial[26] = 59; // Bishop c8
    initial[27] = 60; // Queen d8
    initial[28] = 61; // King e8
    initial[29] = 62; // Bishop f8
    initial[30] = 63; // Knight g8
    initial[31] = 64; // Rook h8

    setBoardState(initial);
  }, []);

  return { boardState, setBoardState };
}
