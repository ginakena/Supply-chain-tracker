import { keccak256, toBytes, zeroHash } from "viem";
import { supplyChainTrackerAbi } from "./abi";

// Set this after deploying SupplyChainTracker (see contracts/README.md).
// You can also override it per-environment with NEXT_PUBLIC_CONTRACT_ADDRESS.
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;

export const CONTRACT_ABI = supplyChainTrackerAbi;

// Mirrors the role constants defined on-chain (keccak256 of the role name).
export const ROLES = {
  ADMIN: zeroHash, // DEFAULT_ADMIN_ROLE is bytes32(0)
  MANUFACTURER: keccak256(toBytes("MANUFACTURER_ROLE")),
  SHIPPER: keccak256(toBytes("SHIPPER_ROLE")),
  RETAILER: keccak256(toBytes("RETAILER_ROLE")),
} as const;

export type RoleName = keyof typeof ROLES;
