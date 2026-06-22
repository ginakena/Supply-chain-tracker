"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function TrackSearch() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/track/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="token-id">
        Token ID
      </label>
      <input
        id="token-id"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter token ID, e.g. 1"
        inputMode="numeric"
        className="focus-ring flex-1 rounded-sm border-2 border-ink bg-paper-card px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-soft/60"
      />
      <button
        type="submit"
        className="focus-ring rounded-sm border-2 border-ink bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper-card transition-colors hover:bg-stamp-rust hover:border-stamp-rust"
      >
        Track
      </button>
    </form>
  );
}
