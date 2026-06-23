"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { foundry, sepolia } from "wagmi/chains";


const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const wagmiConfig = getDefaultConfig({
  appName: "Supply Chain Tracker",
  projectId: walletConnectProjectId,
  chains: [sepolia, foundry],
  ssr: true,
});
