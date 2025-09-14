"use client";

import { useSearchParams } from "next/navigation";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import PdaBoard from "../PdaBoard";
import { useMemo } from "react";

export default function BoardPage() {
  const searchParams = useSearchParams();
  const pda = searchParams.get("pda"); // returns string | null
  const endpoint = "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col items-center gap-2 p-4 flex-2 border-1">
            <PdaBoard pda={pda}/>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}