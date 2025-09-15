"use client";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import Table from "../components/Table";
import { useMemo } from "react";

export default function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ pda?: string }>;
}) {
  const endpoint = "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col items-center gap-2 p-4 flex-2 border-1">
            <Table searchParams={searchParams} />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
