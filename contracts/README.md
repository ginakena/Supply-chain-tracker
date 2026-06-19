# Supply Chain Tracker — Smart Contracts

Foundry project for `SupplyChainTracker.sol`, an ERC-721 + AccessControl contract that
turns every physical product into an on-chain certificate of authenticity with a full,
immutable custody history (manufacturer → shipper → retailer → consumer, and any resale
after that).

## How it works

- Each physical product is minted as an NFT by an account holding `MANUFACTURER_ROLE`.
  A serial number can only ever be registered once, which stops the same serial being
  cloned onto a second, counterfeit item.
- `SHIPPER_ROLE` accounts log pickup and any number of in-transit checkpoints.
- `RETAILER_ROLE` accounts log receipt at the store and the final sale, which is the
  point where the actual NFT is transferred into the consumer's wallet.
- After the sale, the NFT behaves like a normal ERC-721 token. If the consumer resells
  it peer-to-peer, that transfer is automatically appended to the on-chain history too
  — the provenance trail never breaks.
- `DEFAULT_ADMIN_ROLE` (held by whoever deploys the contract, or whoever you pass into
  the constructor) grants and revokes the other three roles.
- `verifyAuthenticity(tokenId, serialNumber)` and `getHistory(tokenId)` are public view
  functions anyone — including an end consumer with no role — can call to check a
  product is genuine and see its full journey.

## Project layout

```
contracts/
├── src/SupplyChainTracker.sol     # the contract
├── test/SupplyChainTracker.t.sol  # Foundry test suite
├── script/Deploy.s.sol            # deployment script
├── foundry.toml
├── remappings.txt
└── package.json                   # only dependency: @openzeppelin/contracts
```

## Setup

```bash
# 1. Install Foundry (skip if already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. From this contracts/ directory:
forge install foundry-rs/forge-std 
npm install   # pulls in @openzeppelin/contracts

# 3. Build & test
forge build
forge test -vvv
```

The contract and test suite were already verified to compile cleanly with `solc 0.8.24`
(EVM version `cancun`, required for OpenZeppelin v5's use of `MCOPY`) before being
handed to you — `forge build` should succeed immediately once the two installs above
are done.

## Deploying

```bash
cp .env.example .env   # fill in PRIVATE_KEY and (optionally) SEPOLIA_RPC_URL
source .env

# Local (start `anvil` in another terminal first)
forge script script/Deploy.s.sol:Deploy --rpc-url localhost --broadcast

# Sepolia testnet
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

Optionally set `MANUFACTURER_ADDRESS`, `SHIPPER_ADDRESS`, `RETAILER_ADDRESS` env vars
before running the script to auto-grant those roles to known addresses on deploy.

## ABI for the frontend

`SupplyChainTracker.abi.json` in this folder is the compiled ABI — copy it into the
frontend's `lib/abi.ts` (the provided frontend already has this wired up).
