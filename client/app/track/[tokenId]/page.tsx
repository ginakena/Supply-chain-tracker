"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
// import { StageBadge } from "@/components/StageBadge";
// import { Timeline } from "@/components/Timeline";
// import { VerifiedStamp } from "@/components/VerifiedStamp";
import { formatAddress, formatTimestamp } from "@/lib/format";
// import type { Product, TrackingEvent } from "@/lib/types";

export default function TrackPage({ params }: { params: { tokenId: string } }) {
  const tokenId = (() => {
    try {
      return BigInt(params.tokenId);
    } catch {
      return undefined;
    }
  })();

  const [serialCheck, setSerialCheck] = useState("");
  const [checkedSerial, setCheckedSerial] = useState<string | null>(null);

  const productQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getProduct",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  const historyQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getHistory",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  const authenticityQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "verifyAuthenticity",
    args: tokenId !== undefined && checkedSerial ? [tokenId, checkedSerial] : undefined,
    query: { enabled: tokenId !== undefined && !!checkedSerial },
  });

  if (tokenId === undefined) {
    return <p className="font-mono text-sm text-stamp-rust">Invalid token ID.</p>;
  }

  const product = productQuery.data as Product | undefined;
  const history = (historyQuery.data as TrackingEvent[] | undefined) ?? [];
  const trackUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="space-y-8">
      <Link href="/" className="focus-ring font-mono text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-ink">
        ← Back to tracker
      </Link>

      {productQuery.isLoading && <p className="font-mono text-sm text-ink-soft">Reading the ledger…</p>}

      {productQuery.isError && (
        <p className="font-mono text-sm text-stamp-rust">
          Token #{tokenId.toString()} was not found on this contract.
        </p>
      )}

      {product && product.exists && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-6 rounded-sm border-2 border-ink bg-paper-card p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Token #{tokenId.toString()}</p>
              <h1 className="mt-1 font-display text-3xl font-semibold">{product.name}</h1>
              <div className="mt-2">
                <StageBadge stage={product.stage} />
              </div>

              <dl className="mt-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 font-mono text-sm">
                <dt className="text-ink-soft">Serial</dt>
                <dd>{product.serialNumber}</dd>
                <dt className="text-ink-soft">Origin</dt>
                <dd>{product.origin}</dd>
                <dt className="text-ink-soft">Manufacturer</dt>
                <dd>{formatAddress(product.manufacturer)}</dd>
                <dt className="text-ink-soft">Current holder</dt>
                <dd>{formatAddress(product.currentHolder)}</dd>
                <dt className="text-ink-soft">Manufactured</dt>
                <dd>{formatTimestamp(product.manufacturedAt)}</dd>
              </dl>
            </div>

            <div className="flex flex-col items-center gap-3">
              {product.stage === 3 ? (
                <VerifiedStamp label="VERIFIED GENUINE" tone="green" />
              ) : (
                <VerifiedStamp label="ON CHAIN" tone="rust" />
              )}
              {trackUrl && (
                <div className="rounded-sm border border-rule bg-white p-2">
                  <QRCodeSVG value={trackUrl} size={88} />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-sm border-2 border-rule bg-paper-card/60 p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Verify authenticity</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Enter the serial number printed on the product to confirm it matches what was registered on-chain.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setCheckedSerial(serialCheck.trim());
              }}
              className="mt-3 flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={serialCheck}
                onChange={(event) => setSerialCheck(event.target.value)}
                placeholder="e.g. SN-001"
                className="focus-ring flex-1 rounded-sm border-2 border-ink bg-white px-4 py-2.5 font-mono text-sm"
              />
              <button
                type="submit"
                className="focus-ring rounded-sm border-2 border-ink bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper-card hover:bg-stamp-rust hover:border-stamp-rust"
              >
                Check
              </button>
            </form>

            {authenticityQuery.data !== undefined && (
              <p
                className={`mt-3 font-mono text-sm ${
                  (authenticityQuery.data as [boolean, number, string])[0] ? "text-stamp-green" : "text-stamp-rust"
                }`}
              >
                {(authenticityQuery.data as [boolean, number, string])[0]
                  ? "✓ Serial matches — this token is authentic."
                  : "✗ Serial does not match this token. This may be counterfeit."}
              </p>
            )}
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Chain of custody</h2>
            <div className="mt-4">
              <Timeline events={history} />
            </div>
          </div>
        </>
      )}

      {product && !product.exists && (
        <p className="font-mono text-sm text-stamp-rust">No product is registered under token #{tokenId.toString()}.</p>
      )}
    </div>
  );
}
