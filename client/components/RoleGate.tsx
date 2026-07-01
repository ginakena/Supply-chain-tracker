"use client";

import { type ReactNode } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACT_ADDRESS, CONTRACT_ABI, ROLES } from "@/lib/contract";

export function RoleGate({
  role,
  roleLabel,
  children,
}: {
  role: keyof typeof ROLES;
  roleLabel: string;
  children: ReactNode;
}) {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  const { data: hasRole, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasRole",
    args: [ROLES[role], address!],
    query: {
      enabled: isConnected && !!address,
      // re-fetch when account changes
      staleTime: 0,
    },
  });

  // still initialising wallet connection
  if (isConnecting || isReconnecting) {
    return <p className="font-mono text-sm text-ink-soft">Connecting wallet…</p>;
  }

  if (!isConnected || !address) {
    return (
      <div className="rounded-sm border-1 border-dashed border-rule bg-paper-card p-8 text-center">
        <p className="font-body text-sm text-ink-soft">
          Connect a wallet to access the {roleLabel} desk.
        </p>
        <div className="mt-4 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-soft">Checking credentials…</p>;
  }

  if (!hasRole) {
    return (
      <div className="rounded-sm border-1 border-stamp-rust bg-paper-card p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stamp-rust">
          Access denied
        </p>
        <p className="mt-2 font-body text-sm text-ink">
          Connected as{" "}
          <span className="font-mono text-xs">{address}</span>
          <br />
          This wallet does not hold the {roleLabel} role.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}