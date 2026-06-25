// "use client";

// import { getDefaultConfig } from "@rainbow-me/rainbowkit";
// import { foundry, sepolia } from "wagmi/chains";


// const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// export const wagmiConfig = getDefaultConfig({
//   appName: "Supply Chain Tracker",
//   projectId: walletConnectProjectId,
//   chains: [sepolia, foundry],
//   ssr: true,
// });

"use client";

import { createConfig, http } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

const connectors = connectorsForWallets(
  [{ groupName: "Wallets", wallets: [injectedWallet, metaMaskWallet] }],
  { appName: "Supply Chain Tracker", projectId: "dummy" }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [foundry, sepolia],
  transports: {
    [foundry.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
