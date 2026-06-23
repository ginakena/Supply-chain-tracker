import { stageLabel } from "@/lib/types";

const STAGE_STYLES: Record<number, string> = {
  0: "border-ink text-ink", // Manufactured
  1: "border-stamp-amber text-stamp-amber", // In Transit
  2: "border-stamp-green text-stamp-green", // Delivered
  3: "border-stamp-rust text-stamp-rust", // Sold
};

export function StageBadge({ stage }: { stage: number }) {
  const style = STAGE_STYLES[stage] ?? "border-ink text-ink";
  return (
    <span
      className={`inline-flex items-center rounded-sm border-2 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.15em] ${style}`}
    >
      {stageLabel(stage)}
    </span>
  );
}
