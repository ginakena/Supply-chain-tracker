export const STAGE_LABELS = ["Manufactured", "In Transit", "Delivered", "Sold"] as const;

export type Stage = 0 | 1 | 2 | 3;

export interface Product {
  name: string;
  serialNumber: string;
  origin: string;
  manufacturer: `0x${string}`;
  currentHolder: `0x${string}`;
  manufacturedAt: bigint;
  stage: Stage;
  exists: boolean;
}

export interface TrackingEvent {
  stage: Stage;
  actor: `0x${string}`;
  location: string;
  notes: string;
  timestamp: bigint;
}

export function stageLabel(stage: number): string {
  return STAGE_LABELS[stage] ?? "Unknown";
}
