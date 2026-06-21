# Supply Chain Tracker — Frontend

A Next.js 14 dashboard for interacting with the `SupplyChainTracker` smart contract.
Connects via wagmi v2 + RainbowKit; works with any wallet (MetaMask, Coinbase, WalletConnect, injected).

## Stack

- **Next.js 14** (App Router)
- **wagmi v2** + **viem** — typed contract reads and writes
- **RainbowKit** — one-click wallet connection
- **Tailwind CSS** — utility-first styling
- **Fraunces** (display) + **IBM Plex Sans** / **Mono** (body/labels) — via next/font/google

## Pages

| Route | Description |
|---|---|
| `/` | Home: tracking search, role desk cards, live recent-products ledger |
| `/track/[tokenId]` | Product detail: metadata, serial-number authenticity check, full custody timeline, QR code |
| `/manufacturer` | Mint new products (requires `MANUFACTURER_ROLE`) |
| `/shipper` | Record pickup & transit checkpoints (requires `SHIPPER_ROLE`) |
| `/retailer` | Record store receipt and sell to consumer (requires `RETAILER_ROLE`) |
| `/admin` | Grant / revoke roles, check roles for any address (requires `DEFAULT_ADMIN_ROLE`) |

## Setup

```bash
# From the frontend/ directory:
npm install

# Copy the env template and fill in your values
cp .env.local.example .env.local

npm run dev   # → http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | ✅ | Deployed `SupplyChainTracker` address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | Get one free at https://cloud.reown.com |

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x…
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=…
```

## Using with a local Anvil network

1. Start Anvil: `anvil`
2. Deploy the contract: `cd ../contracts && forge script script/Deploy.s.sol:Deploy --rpc-url localhost --broadcast`
3. Copy the deployed address into `.env.local`
4. In MetaMask (or any wallet), add Anvil as a custom network:
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
5. Import one of Anvil's funded test accounts using its private key
6. Use the **Admin** desk (you're already the deployer/admin) to grant roles to other test accounts, then go through the full lifecycle from the other desks
