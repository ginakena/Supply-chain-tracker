"use client";

import { useState, type FormEvent } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { RoleGate } from "@/components/RoleGate";

type Action = "pickup" | "checkpoint";

function ShipperForm() {
  const [tokenId, setTokenId] = useState("");
  const [action, setAction] = useState<Action>("pickup");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const id = BigInt(tokenId);
    if (action === "pickup") {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "recordPickup",
        args: [id, location, notes],
      });
    } else {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "recordTransitCheckpoint",
        args: [id, location, notes],
      });
    }
  }

  return (
    <div className="rounded-sm border-2 border-ink bg-paper-card p-6">
      <h2 className="font-display text-xl font-semibold">Log a shipment event</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Use <strong>Pickup</strong> for the first handoff from the manufacturer. Use{" "}
        <strong>Checkpoint</strong> for any subsequent scan in transit.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Token ID</label>
          <input
            required
            inputMode="numeric"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="e.g. 1"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-mono text-sm"
          />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Action</span>
          <div className="mt-1.5 flex gap-3">
            {(["pickup", "checkpoint"] as const).map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-sm border-2 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  action === opt ? "border-ink bg-ink text-paper-card" : "border-rule text-ink-soft hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={opt}
                  checked={action === opt}
                  onChange={() => setAction(opt)}
                  className="sr-only"
                />
                {opt === "pickup" ? "Pickup" : "Checkpoint"}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Location</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. JKIA Cargo Terminal, Nairobi"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-body text-sm"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared customs, temp OK"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-body text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="focus-ring rounded-sm border-2 border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper-card transition-colors hover:bg-stamp-amber hover:border-stamp-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Confirm in wallet…" : isConfirming ? "Recording…" : "Log event"}
        </button>

        {writeError && (
          <p className="font-mono text-xs text-stamp-rust">{writeError.message.split("\n")[0]}</p>
        )}
      </form>

      {isSuccess && (
        <div className="mt-5 rounded-sm border-2 border-stamp-amber bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stamp-amber">Checkpoint recorded</p>
          <p className="mt-1 font-body text-sm">
            The event has been written to the chain. The product&apos;s timeline has been updated.
          </p>
          <button
            onClick={() => {
              setTokenId("");
              setLocation("");
              setNotes("");
              reset();
            }}
            className="focus-ring mt-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline hover:text-ink"
          >
            Log another
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShipperPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stamp-amber">Desk 02</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Shipper</h1>
      </div>
      <RoleGate role="SHIPPER" roleLabel="shipper">
        <ShipperForm />
      </RoleGate>
    </div>
  );
}
