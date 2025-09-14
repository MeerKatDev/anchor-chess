import { useState, useEffect } from "react";
import { useAnchorProgram } from "./hooks/useAnchorProgram";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

export default function BoardsList() {
  const { getProgram } = useAnchorProgram();
  const wallet = useWallet();
  const [boards, setBoards] = useState<{ pubkey: PublicKey; account: any }[]>([]);
  const [loading, setLoading] = useState(false);
  if (!wallet) return; // wait for wallet to connect
  const walletPubkey = wallet.publicKey;

  useEffect(() => {
    const fetchBoards = async () => {
      setLoading(true);
      try {
        const program = getProgram();
        const boardAccounts = await program.account.board.all(); // async RPC call
        const formatted = boardAccounts.map(b => ({
          pubkey: b.publicKey,
          account: b.account,
        }));
        setBoards(formatted);
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
      {boards.map(({ pubkey, account }) => (
        <div key={pubkey.toBase58()} className="border p-2 rounded">
		      <p>
		        <strong>PDA:</strong>{" "}
		        <Link
			      href={{
			        pathname: '/table',
			        query: { pda: pubkey.toBase58() },
			      }}
		          className="text-blue-600 hover:underline"
		        >
		          {pubkey.toBase58()}
		        </Link>
      		</p>
	        <p><strong>White:</strong> {account.maker.toBase58()}</p>
	        <p><strong>Black:</strong> {account.guest?.toBase58() ?? "Open"}</p>
        </div>
      ))}
    </div>
  );
}
