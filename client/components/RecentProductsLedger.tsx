"use client";

import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { StageBadge } from "./StageBadge";
import { formatAddress } from "@/lib/format";
import type { Product } from "@/lib/types";

const MAX_ROWS = 8;

export function RecentProductsLedger() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalProducts",
  });

  const totalCount = total ? Number(total) : 0;
  const start = Math.max(1, totalCount - MAX_ROWS + 1);
  const tokenIds = totalCount > 0 ? Array.from({ length: totalCount - start + 1 }, (_, i) => BigInt(totalCount - i)) : [];

  const { data: products, isLoading } = useReadContracts({
    contracts: tokenIds.map((tokenId) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getProduct",
      args: [tokenId],
    })),
    query: { enabled: tokenIds.length > 0 },
  });

  if (totalCount === 0) {
    return (
      <p className="font-mono text-sm text-ink-soft">
        No products registered yet. Once a manufacturer mints one, it will show up here.
      </p>
    );
  }

  if (isLoading) {
    return <p className="font-mono text-sm text-ink-soft">Loading ledger…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-sm border-2 border-ink">
      <table className="w-full min-w-[560px] text-left font-mono text-xs">
        <thead className="border-b-2 border-ink bg-ink text-paper-card">
          <tr>
            <th className="px-3 py-2 uppercase tracking-[0.15em]">Token</th>
            <th className="px-3 py-2 uppercase tracking-[0.15em]">Product</th>
            <th className="px-3 py-2 uppercase tracking-[0.15em]">Serial</th>
            <th className="px-3 py-2 uppercase tracking-[0.15em]">Stage</th>
            <th className="px-3 py-2 uppercase tracking-[0.15em]">Manufacturer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {tokenIds.map((tokenId, index) => {
            const result = products?.[index];
            const product = result?.result as Product | undefined;
            if (!product) return null;

            return (
              <tr key={tokenId.toString()} className="bg-paper-card">
                <td className="px-3 py-2">
                  <Link href={`/track/${tokenId}`} className="focus-ring underline decoration-rule hover:decoration-ink">
                    #{tokenId.toString()}
                  </Link>
                </td>
                <td className="px-3 py-2 font-body text-ink">{product.name}</td>
                <td className="px-3 py-2">{product.serialNumber}</td>
                <td className="px-3 py-2">
                  <StageBadge stage={product.stage} />
                </td>
                <td className="px-3 py-2">{formatAddress(product.manufacturer)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
