"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Environment, ParaProvider } from "@getpara/react-sdk";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import {
  metaMaskWallet,
  walletConnectWallet,
  ParaEvmProvider,
  coinbaseWallet,
  okxWallet,
} from "@getpara/evm-wallet-connectors";
import { CampProvider } from "@campnetwork/origin/react";
import { testnet } from "../../utils/chain";
import "@getpara/react-sdk/styles.css";

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL || "",
  cache: new InMemoryCache(),
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CampProvider clientId="9123887d-94f0-4427-a2f7-cd04d16c1fc3">
        <ParaProvider
          paraClientConfig={{
            env: Environment.PRODUCTION,
            apiKey: process.env.NEXT_PUBLIC_PARA_API_KEY || "",
            opts: {
              externalWalletConnectionOnly: true,
            },
          }}
        >
          <ParaEvmProvider
            config={{
              projectId: "2902571ec972fe433a9f311b7be52790",
              appName: "Camp",
              chains: [testnet],
              wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet, okxWallet],
            }}
          >
            <ApolloProvider client={client}>
              {children}
            </ApolloProvider>
          </ParaEvmProvider>
        </ParaProvider>
      </CampProvider>
    </QueryClientProvider>
  );
} 