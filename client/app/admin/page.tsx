"use client";

import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { useWaitForTransactionReceipt, useWriteContract, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI, ROLES, type RoleName } from "@/lib/contract";
import { RoleGate } from "@/components/RoleGate";
// import { formatAddress } from "@/lib/format";

const GRANTABLE_ROLES: { key: RoleName; label: string; description: string }[] = [
  {
    key: "MANUFACTURER",
    label: "Manufacturer",
    description: "Can register new products and mint their NFTs.",
  },
  {
    key: "SHIPPER",
    label: "Shipper",
    description: "Can log pickup and transit checkpoints.",
  },
  {
    key: "RETAILER",
    label: "Retailer",
    description: "Can record delivery receipts and sell products to consumers.",
  },
  {
    key: "ADMIN",
    label: "Admin",
    description: "Can grant and revoke all roles, including admin.",
  },
];

function RoleChecker() {
  const [checkAddress, setCheckAddress] = useState("");
  const [submitted, setSubmitted] = useState("");

  const results = GRANTABLE_ROLES.map(({ key }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "hasRole",
      args: [ROLES[key], submitted as `0x${string}`],
      query: { enabled: !!submitted && isAddress(submitted) },
    })
  );

  return (
    <div className="rounded-sm border-2 border-rule bg-paper-card/60 p-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Check roles for an address</h3>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (isAddress(checkAddress)) setSubmitted(checkAddress);
        }}
        className="mt-3 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={checkAddress}
          onChange={(e) => setCheckAddress(e.target.value)}
          placeholder="0x…"
          className="focus-ring flex-1 rounded-sm border-2 border-ink bg-white px-4 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          className="focus-ring rounded-sm border-2 border-ink bg-ink px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-paper-card hover:bg-ink/80"
        >
          Lookup
        </button>
      </form>

      {submitted && isAddress(submitted) && (
        <div className="mt-4">
          <p className="font-mono text-xs text-ink-soft">Roles held by {formatAddress(submitted)}</p>
          <ul className="mt-2 divide-y divide-rule">
            {GRANTABLE_ROLES.map(({ key, label }, i) => (
              <li key={key} className="flex items-center justify-between py-1.5 font-mono text-xs">
                <span>{label}</span>
                {results[i].isLoading ? (
                  <span className="text-ink-soft">…</span>
                ) : results[i].data ? (
                  <span className="text-stamp-green">✓ Granted</span>
                ) : (
                  <span className="text-ink-soft/50">— Not held</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GrantRevokeForm() {
  const [targetAddress, setTargetAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleName>("MANUFACTURER");
  const [op, setOp] = useState<"grant" | "revoke">("grant");
  const [addressError, setAddressError] = useState("");

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAddressError("");
    if (!isAddress(targetAddress)) {
      setAddressError("Enter a valid Ethereum address.");
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: op === "grant" ? "grantRole" : "revokeRole",
      args: [ROLES[selectedRole], targetAddress as `0x${string}`],
    });
  }

  return (
    <div className="rounded-sm border-2 border-ink bg-paper-card p-6">
      <h2 className="font-display text-xl font-semibold">Grant or revoke a role</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Your wallet must hold the Admin role to perform these actions.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Wallet address</label>
          <input
            required
            value={targetAddress}
            onChange={(e) => {
              setTargetAddress(e.target.value);
              setAddressError("");
            }}
            placeholder="0x…"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-mono text-sm"
          />
          {addressError && <p className="mt-1 font-mono text-xs text-stamp-rust">{addressError}</p>}
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Role</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {GRANTABLE_ROLES.map(({ key, label, description }) => (
              <label
                key={key}
                className={`flex cursor-pointer flex-col rounded-sm border-2 px-3 py-2.5 transition-colors ${
                  selectedRole === key
                    ? "border-ink bg-ink text-paper-card"
                    : "border-rule text-ink hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={key}
                  checked={selectedRole === key}
                  onChange={() => setSelectedRole(key)}
                  className="sr-only"
                />
                <span className="font-mono text-xs uppercase tracking-[0.12em]">{label}</span>
                <span
                  className={`mt-0.5 font-body text-xs leading-snug ${
                    selectedRole === key ? "text-paper-card/70" : "text-ink-soft"
                  }`}
                >
                  {description}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Operation</span>
          <div className="mt-1.5 flex gap-3">
            {(["grant", "revoke"] as const).map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-sm border-2 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  op === opt ? "border-ink bg-ink text-paper-card" : "border-rule text-ink-soft hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="op"
                  value={opt}
                  checked={op === opt}
                  onChange={() => setOp(opt)}
                  className="sr-only"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className={`focus-ring rounded-sm border-2 px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper-card transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            op === "revoke"
              ? "border-stamp-rust bg-stamp-rust hover:bg-stamp-rust/80 hover:border-stamp-rust/80"
              : "border-ink bg-ink hover:bg-ink/80"
          }`}
        >
          {isPending ? "Confirm in wallet…" : isConfirming ? "Writing…" : `${op === "grant" ? "Grant" : "Revoke"} role`}
        </button>

        {writeError && (
          <p className="font-mono text-xs text-stamp-rust">{writeError.message.split("\n")[0]}</p>
        )}
      </form>

      {isSuccess && (
        <div className="mt-5 rounded-sm border-2 border-stamp-green bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stamp-green">Done</p>
          <p className="mt-1 font-body text-sm">
            Role {op === "grant" ? "granted to" : "revoked from"}{" "}
            <span className="font-mono">{formatAddress(targetAddress)}</span>.
          </p>
          <button
            onClick={() => {
              setTargetAddress("");
              reset();
            }}
            className="focus-ring mt-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline hover:text-ink"
          >
            Another action
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink">Desk 04</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Admin</h1>
      </div>
      <RoleGate role="ADMIN" roleLabel="admin">
        <div className="space-y-6">
          <GrantRevokeForm />
          <RoleChecker />
        </div>
      </RoleGate>
    </div>
  );
}
