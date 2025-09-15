import { useState, useEffect } from "react";
import useAnchorProgram from "./hooks/useAnchorProgram";
import { web3, BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

function truncateMiddle(
  str: string,
  front: number = 4,
  back: number = 4
): string {
  if (!str) return "";
  if (str.length <= front + back) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
}

interface Board {
  isWhiteTurn: boolean;
  bump: number;
  seed: BN;
  maker: web3.PublicKey;
  guest: web3.PublicKey;
  state: number[];
  gameOver: boolean;
}

export default function BoardsList() {
  const { getProgram } = useAnchorProgram();
  const wallet = useWallet();
  const [boards, setBoards] = useState<
    { pubkey: web3.PublicKey; account: Board }[]
  >([]);
  const [loading, setLoading] = useState(false);
  if (!wallet) return; // wait for wallet to connect
  const walletPubkey = wallet.publicKey;

  useEffect(() => {
    const fetchBoards = async () => {
      setLoading(true);
      try {
        const program = getProgram();
        const boardAccounts = await program.account.board.all(); // async RPC call
        setBoards(boardAccounts);
      } catch (err) {
        console.error("Failed to fetch boards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [walletPubkey]); // runs once when wallet connects

  if (loading) return <div>Loading boards...</div>;
  if (boards.length === 0) return <div>No boards found.</div>;

  return (
    <div className="flex flex-col gap-8 flex-2">
      {boards.map(({ publicKey: pubkey, account }) => (
        <div key={pubkey.toBase58()} className="border p-4 rounded">
          <p>
            <strong>PDA:</strong>{" "}
            <Link
              href={{
                pathname: "/table",
                query: { pda: pubkey.toBase58() },
              }}
              className="text-blue-600 hover:underline"
            >
              {truncateMiddle(pubkey.toBase58(), 6, 6)}
            </Link>
          </p>
          <p>
            <strong>White:</strong>{" "}
            {truncateMiddle(account.maker.toBase58(), 6, 6)}
          </p>
          <p>
            <strong>Black:</strong>{" "}
            {(account.guest &&
              truncateMiddle(account.guest?.toBase58(), 6, 6)) ||
              "Open"}
          </p>
        </div>
      ))}
    </div>
  );
}
