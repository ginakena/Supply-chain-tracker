"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { decodeEventLog } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { RoleGate } from "@/components/RoleGate";

function MintForm() {
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [origin, setOrigin] = useState("");
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!receipt) return;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });
        if (decoded.eventName === "ProductRegistered") {
          setMintedTokenId((decoded.args as { tokenId: bigint }).tokenId);
        }
      } catch {
        // not a matching log, ignore
      }
    }
  }, [receipt]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMintedTokenId(null);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "mintProduct",
      args: [name, serialNumber, origin],
    });
  }

  return (
    <div className="rounded-sm border-2 border-ink bg-paper-card p-6">
      <h2 className="font-display text-xl font-semibold">Register a new product</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Each serial number can only be registered once — duplicates are rejected on-chain.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Product name</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Leather Wallet"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-body text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Serial number</label>
          <input
            required
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
            placeholder="e.g. SN-001"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-mono text-sm"
          />
        </div>
        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Origin</label>
          <input
            required
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            placeholder="e.g. Nairobi, Kenya"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-body text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="focus-ring rounded-sm border-2 border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper-card transition-colors hover:bg-stamp-rust hover:border-stamp-rust disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Confirm in wallet…" : isConfirming ? "Minting…" : "Register & mint"}
        </button>

        {writeError && (
          <p className="font-mono text-xs text-stamp-rust">{writeError.message.split("\n")[0]}</p>
        )}
      </form>

      {mintedTokenId !== null && (
        <div className="mt-5 rounded-sm border-2 border-stamp-green bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stamp-green">Registered</p>
          <p className="mt-1 font-body text-sm">
            Minted as{" "}
            <Link href={`/track/${mintedTokenId}`} className="underline">
              token #{mintedTokenId.toString()}
            </Link>
            . Hand the physical item to a shipper to begin its journey.
          </p>
          <button
            onClick={() => {
              setName("");
              setSerialNumber("");
              setOrigin("");
              setMintedTokenId(null);
              reset();
            }}
            className="focus-ring mt-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline hover:text-ink"
          >
            Register another
          </button>
        </div>
      )}
    </div>
  );
}

export default function ManufacturerPage() {
  return (
    <div className="space-y-6">
      <div>
        
        <h1 className="mt-1 font-display text-3xl font-semibold">Manufacturer</h1>
      </div>
      <RoleGate role="MANUFACTURER" roleLabel="manufacturer">
        <MintForm />
      </RoleGate>
    </div>
  );
}
