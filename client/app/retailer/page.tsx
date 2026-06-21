"use client";

import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { RoleGate } from "@/components/RoleGate";

type Action = "receipt" | "sell";

function RetailerForm() {
  const [tokenId, setTokenId] = useState("");
  const [action, setAction] = useState<Action>("receipt");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [consumer, setConsumer] = useState("");
  const [addressError, setAddressError] = useState("");

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAddressError("");
    const id = BigInt(tokenId);

    if (action === "receipt") {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "recordRetailerReceipt",
        args: [id, location, notes],
      });
    } else {
      if (!isAddress(consumer)) {
        setAddressError("Enter a valid Ethereum address.");
        return;
      }
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "sellToConsumer",
        args: [id, consumer as `0x${string}`, notes],
      });
    }
  }

  return (
    <div className="rounded-sm border-2 border-ink bg-paper-card p-6">
      <h2 className="font-display text-xl font-semibold">Retailer desk</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        Use <strong>Receipt</strong> when stock arrives at the store. Use <strong>Sell</strong> to
        close the sale — this transfers the NFT to the consumer&apos;s wallet.
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
            {(["receipt", "sell"] as const).map((opt) => (
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
                {opt === "receipt" ? "Receipt" : "Sell to consumer"}
              </label>
            ))}
          </div>
        </div>

        {action === "receipt" && (
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Store location</label>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Westgate Mall, Nairobi"
              className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-body text-sm"
            />
          </div>
        )}

        {action === "sell" && (
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              Consumer wallet address
            </label>
            <input
              required
              value={consumer}
              onChange={(e) => {
                setConsumer(e.target.value);
                setAddressError("");
              }}
              placeholder="0x…"
              className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-mono text-sm"
            />
            {addressError && (
              <p className="mt-1 font-mono text-xs text-stamp-rust">{addressError}</p>
            )}
          </div>
        )}

        <div>
          <label className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Receipt #4521, paid in full"
            className="focus-ring mt-1 w-full rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-body text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="focus-ring rounded-sm border-2 border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper-card transition-colors hover:bg-stamp-green hover:border-stamp-green disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Confirm in wallet…" : isConfirming ? "Processing…" : action === "receipt" ? "Record receipt" : "Complete sale"}
        </button>

        {writeError && (
          <p className="font-mono text-xs text-stamp-rust">{writeError.message.split("\n")[0]}</p>
        )}
      </form>

      {isSuccess && (
        <div className="mt-5 rounded-sm border-2 border-stamp-green bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stamp-green">
            {action === "receipt" ? "Receipt confirmed" : "Sale completed"}
          </p>
          <p className="mt-1 font-body text-sm">
            {action === "receipt"
              ? "The product's receipt has been recorded. It is ready to be sold."
              : "Ownership of the NFT has been transferred to the consumer's wallet."}
          </p>
          <button
            onClick={() => {
              setTokenId("");
              setLocation("");
              setNotes("");
              setConsumer("");
              reset();
            }}
            className="focus-ring mt-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft underline hover:text-ink"
          >
            New transaction
          </button>
        </div>
      )}
    </div>
  );
}

export default function RetailerPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-stamp-green">Desk 03</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Retailer</h1>
      </div>
      <RoleGate role="RETAILER" roleLabel="retailer">
        <RetailerForm />
      </RoleGate>
    </div>
  );
}
