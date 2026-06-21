"use client";

import { type ReactNode } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
// import { CONTRACT_ADDRESS, CONTRACT_ABI, ROLES } from "@/lib/contract";

export function RoleGate({
  role,
  roleLabel,
  children,
}: {
  role: keyof typeof ROLES;
  roleLabel: string;
  children: ReactNode;
}) {
  const { address, isConnected } = useAccount();

  const { data: hasRole, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasRole",
    args: [ROLES[role], address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: isConnected },
  });

  if (!isConnected) {
    return (
      <div className="rounded-sm border-2 border-dashed border-rule bg-paper-card p-8 text-center">
        <p className="font-body text-sm text-ink-soft">Connect a wallet to access the {roleLabel} desk.</p>
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
      <div className="rounded-sm border-2 border-stamp-rust bg-paper-card p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stamp-rust">Access denied</p>
        <p className="mt-2 font-body text-sm text-ink">
          This wallet does not hold the {roleLabel} role. Ask an admin to grant it from the Admin desk.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
