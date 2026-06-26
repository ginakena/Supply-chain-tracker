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
import { foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  connectors: [injected()],
  chains: [foundry],
  transports: {
    [foundry.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});