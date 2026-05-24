# ◆ Ritual Mosaic

A collaborative onchain PFP mosaic dApp built on **Ritual Chain Testnet**. The white bands of the Ritual logo are divided into 133 diamond-shaped slots. Each slot is permanently claimable with a profile picture, X profile link, and name — all stored onchain forever.

## What it does
- The Ritual knot logo is reconstructed in SVG code (not an image)
- 133 diamond slots sit perfectly inside the white bands
- Users upload their PFP → it goes to IPFS via Pinata → IPFS hash stored onchain
- Each slot links to the claimer's X (Twitter) profile
- The green background fills with a cursive collage of all claimers' names
- Once a slot is claimed it's locked forever — no one can overwrite it
- Zoom in/out and pan around the full mosaic
- Progress bar shows how many of 133 slots remain

---

## Prerequisites
- Node.js v18+
- MetaMask with Ritual Testnet:
  - RPC: https://rpc.ritualfoundation.org
  - Chain ID: 1979
  - Symbol: RITUAL
- Testnet RITUAL tokens
- Free Pinata account: https://pinata.cloud
- Free WalletConnect Project ID: https://cloud.walletconnect.com

---

## Project Structure
```
RitualMosaic/
├── contracts/
│   └── RitualMosaic.sol         ← Smart contract
├── scripts/
│   └── deploy.ts                ← Deploy script
├── hardhat.config.ts
├── package.json                 ← Contract deps
├── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                 ← Next.js pages
│   │   ├── components/
│   │   │   ├── MosaicCanvas.tsx ← Main SVG canvas
│   │   │   ├── ClaimModal.tsx   ← Claim flow UI
│   │   │   └── Providers.tsx    ← Wallet providers
│   │   ├── hooks/
│   │   │   └── useContract.ts   ← Wagmi hooks
│   │   └── lib/
│   │       ├── config.ts        ← Chain + ABI config
│   │       ├── pinata.ts        ← IPFS upload
│   │       └── slotCoords.ts    ← 133 slot coordinates
│   └── .env.example
└── README.md
```

---

## Step 1 — Get your API keys

### Pinata (IPFS storage)
1. Go to https://pinata.cloud → Sign up free
2. Go to API Keys → New Key
3. Enable `pinFileToIPFS` permission
4. Copy your API Key and Secret Key

### WalletConnect
1. Go to https://cloud.walletconnect.com → Sign in with GitHub
2. Create New Project → type "RitualMosaic"
3. Copy the Project ID

---

## Step 2 — Deploy the Smart Contract

```powershell
cd RitualMosaic
npm install
copy .env.example .env
```

Edit `.env`:
```
PRIVATE_KEY=your_wallet_private_key_here
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
```

```powershell
npm run compile
npm run deploy
```

Output:
```
✅ RitualMosaic deployed to: 0xABCDEF...
Add to frontend/.env.local:
NEXT_PUBLIC_CONTRACT_ADDRESS=0xABCDEF...
```

**Copy that address.**

---

## Step 3 — Run the Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourAddressHere
NEXT_PUBLIC_CHAIN_ID=1979
NEXT_PUBLIC_RPC_URL=https://rpc.ritualfoundation.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

```powershell
npm run dev
```

Open http://localhost:3000

---

## Step 4 — Deploy to Vercel

```powershell
cd ..
git init
git add .
git commit -m "Initial RitualMosaic commit"
git remote add origin https://github.com/YOUR_USERNAME/ritual-mosaic.git
git push -u origin main
```

On Vercel:
1. New Project → Import repo
2. Root Directory → set to `frontend`
3. Add all 6 environment variables from `.env.local`
4. Deploy ✅

---

## How Users Claim a Slot
1. Visit the site — see the full Ritual knot mosaic
2. Scroll/zoom to explore — empty slots glow faintly
3. Click any empty diamond slot
4. Fill in: Profile Photo + Your Name + X Profile URL (optional)
5. Connect MetaMask → pay 0.001 RITUAL
6. Photo uploads to IPFS, claim recorded onchain permanently
7. Your PFP appears in the mosaic, name appears in background collage

---

## Contract Functions
| Function | Description |
|----------|-------------|
| `claimSlot(id, ipfsHash, xHandle, name)` | Claim a slot, requires payment |
| `getAllSlots()` | Returns all 133 slots |
| `getSlot(id)` | Get single slot data |
| `claimedCount()` | Total slots claimed |
| `setSlotPrice(price)` | Owner: update price |
| `withdraw()` | Owner: withdraw RITUAL |

---

## Tech Stack
- Blockchain: Ritual Chain Testnet (Chain ID: 1979)
- Smart Contract: Solidity 0.8.20 + Hardhat
- Storage: IPFS via Pinata (free tier)
- Frontend: Next.js 14 + TypeScript
- Wallet: wagmi v2 + viem + RainbowKit
- Styling: Tailwind CSS + Framer Motion
- Deploy: Vercel

---

## Troubleshooting

**Pinata upload fails** → Check your API key and secret are correct in `.env.local`

**Slot shows as loading** → IPFS gateway can be slow, refresh after 30 seconds

**Cannot connect wallet** → Make sure Ritual Testnet is added to MetaMask with Chain ID 1979

**Build fails on Vercel** → Make sure Root Directory is set to `frontend` and all 6 env vars are added
