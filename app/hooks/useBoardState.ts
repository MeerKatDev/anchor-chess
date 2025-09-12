import { useState, useEffect } from "react";

export function useBoardState() {
  const [boardState, setBoardState] = useState<(string | null)[]>(
    Array(64).fill(null)
  );

  useEffect(() => {
    const initial = Array(64).fill(null);
    for (let i = 8; i < 16; i++) initial[i] = "P";
    for (let i = 48; i < 56; i++) initial[i] = "p";
    initial[0] = "R";
    initial[7] = "R";
    initial[1] = "N";
    initial[6] = "N";
    initial[2] = "B";
    initial[5] = "B";
    initial[3] = "Q";
    initial[4] = "K";
    initial[56] = "r";
    initial[63] = "r";
    initial[57] = "n";
    initial[62] = "n";
    initial[58] = "b";
    initial[61] = "b";
    initial[59] = "q";
    initial[60] = "k";

    setBoardState(initial);
  }, []);

  return { boardState, setBoardState };
}
