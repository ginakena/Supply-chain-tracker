"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV_ITEMS = [
  { href: "/", label: "Track" },
  { href: "/manufacturer", label: "Manufacturer" },
  { href: "/shipper", label: "Shipper" },
  { href: "/retailer", label: "Retailer" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b-1 border-ink bg-ink text-paper-card">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight">Supply Chain Tracker</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-paper-card/50 sm:inline">
            on-chain manifest
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1 font-mono text-xs uppercase tracking-wider">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring rounded px-2.5 py-1.5 transition-colors ${
                  active ? "bg-paper-card text-ink" : "text-paper-card/70 hover:text-paper-card"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="[&_button]:font-mono [&_button]:text-xs">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}
