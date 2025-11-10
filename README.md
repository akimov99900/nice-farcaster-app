# BearBrick – Personalized NFT Preview Mini-App

BearBrick is a Farcaster mini-app that welcomes members of the network with a personalized BearBrick companion. The experience authenticates the visitor, extracts a colour palette from their Farcaster avatar, and renders an inline BearBrick NFT preview that adapts to those tones. The interface has been rebranded end-to-end for the BearBrick identity, replacing the former wish-and-vote flow with a clean trio of preview states: loading, ready, and error.

## ✨ Highlights

- **BearBrick branding** – Updated layout, metadata, manifest, and iconography for the BearBrick universe.
- **Farcaster-ready authentication** – Powered by [`@lab/farcaster-auth`](https://www.npmjs.com/package/@lab/farcaster-auth) to handle initialization, mock mode, and error reporting.
- **Avatar-aware theming** – [`@lab/color-extraction`](https://www.npmjs.com/package/@lab/color-extraction) derives two key colours from the user’s profile picture and applies them throughout the preview.
- **Inline BearBrick NFT rendering** – [`@lab/nft-utils`](https://www.npmjs.com/package/@lab/nft-utils) produces a bespoke SVG BearBrick using the extracted palette, with graceful fallbacks when data is unavailable.
- **Accessible states** – Loading, ready, and error states surface clear messaging, ARIA labelling, and responsive layouts for both real and mock authentication flows.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm (ships with Node.js)

### Local development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the dev server**
   ```bash
   npm run dev
   ```

3. **Visit the app**
   Open [http://localhost:3000](http://localhost:3000) in your browser. When the Farcaster client context is absent, the experience falls back to a mock user so you can preview the BearBrick UI locally.

## 🗂 Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── health/route.ts           # Health check endpoint
│   │   ├── info/route.ts             # App metadata endpoint
│   │   ├── image/[fid]/route.ts      # BearBrick SVG image generation
│   │   ├── metadata/[fid]/route.ts   # ERC721 metadata endpoint
│   │   └── token-uri/route.ts        # Token URI generation for minting
│   ├── globals.css                   # Global BearBrick styling
│   ├── layout.tsx                    # Root layout + metadata
│   └── page.tsx                      # BearBrick preview and mint flow
├── lib/
│   └── viem-client.ts                # Web3 utilities for minting and contract interaction
├── public/
│   ├── icon.svg                      # BearBrick app icon
│   └── manifest.json                 # Mini-app manifest
├── packages/
│   ├── bearbrick-contract/           # BearBrick NFT contract ABI and addresses
│   ├── color-extraction/             # Color palette extraction utilities
│   ├── farcaster-auth/               # Farcaster authentication helpers
│   └── nft-utils/                    # BearBrick SVG generation utilities
├── types/lab.d.ts                    # Module declarations for @lab packages
├── next.config.js                    # Next.js configuration
├── package.json                      # Scripts & dependencies
└── README.md
```

## 🧭 Experience Flow

| State    | Description |
|----------|-------------|
| **Loading** | BearBrick authenticates the visitor and begins extracting colours from their avatar. Animated copy communicates that the preview is being prepared. |
| **Ready** | A personalised BearBrick SVG appears, tinted with the extracted palette. Primary and accent colour swatches are surfaced alongside FID, username, and contextual copy. |
| **Error** | If authentication fails (or the app is opened outside of a Farcaster context), a friendly message explains how to access BearBrick properly. |

Mock mode mirrors the ready state so designers and engineers can iterate locally without a Farcaster session.

## 🔐 Authentication & Personalisation

1. `@lab/farcaster-auth` orchestrates Farcaster user bootstrapping. The hook exposes loading, ready, and error signals, plus a mock fallback for local development.
2. Once a user with a profile image is available, `@lab/color-extraction` resolves two dominant colours. Robust guards prevent extraction errors from breaking the UI, reverting to a curated BearBrick palette when necessary.
3. `@lab/nft-utils` receives the FID, handle, and the derived palette to produce an inline SVG BearBrick. If the utility fails or is unavailable, the UI presents a delightful placeholder instead of breaking.

## 🎨 Design System

- **Backgrounds** – Layered radial and linear gradients create a deep-space neon atmosphere.
- **Typography** – [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) supplies geometric, legible headings and body copy.
- **Focus on contrast** – Text and interactive affordances use high-contrast colour pairs; ARIA attributes label key visuals for screen-reader users.
- **Responsive layout** – The preview container and swatch grid gracefully adapt from mobile to large displays without horizontal scrolling.

## 🔌 API Surface

| Endpoint           | Method | Purpose                                                                          |
|--------------------|--------|----------------------------------------------------------------------------------|
| `/api/health`      | GET    | Returns uptime, timestamp, and health status                                     |
| `/api/info`        | GET    | Exposes version, features, and endpoint list                                     |
| `/api/token-uri`   | POST   | Generates BearBrick metadata and encoded token URI for NFT minting               |
| `/api/image/[fid]` | GET    | Returns BearBrick SVG image for a given FID                                     |
| `/api/metadata/[fid]` | GET | Returns ERC721 metadata JSON for a given FID                                   |

### Token URI Endpoint

The `/api/token-uri` endpoint generates complete metadata and an encoded token URI in a single request:

**Request:**
```json
{
  "fid": 1234,
  "username": "vitalik",
  "displayName": "Vitalik Buterin",
  "primaryColor": "#5ab0ff",
  "secondaryColor": "#ff7bfb"
}
```

**Response:**
```json
{
  "metadata": {
    "name": "Vitalik Buterin's BearBrick",
    "description": "A personalized BearBrick NFT generated for Vitalik Buterin...",
    "image": "data:image/svg+xml;base64,<encoded SVG>",
    "external_url": "https://your-app-url.vercel.app",
    "attributes": [...]
  },
  "tokenUri": "data:application/json;base64,<encoded metadata>"
}
```

**Features:**
- Accepts FID, username, and color pair
- Validates color hex codes (6-character format)
- Generates inline SVG as base64 data URL
- Returns metadata and tokenUri for contract minting
- Caches results per FID per session (1-hour TTL)
- Handles errors gracefully with descriptive messages

## ⚙️ Environment Variables

| Variable                                       | Required | Description                                      |
|------------------------------------------------|----------|--------------------------------------------------|
| `NEXT_PUBLIC_APP_URL`                          | No       | Base URL for metadata generation and token URIs (defaults to production URL)  |
| `NEXT_PUBLIC_BEARBRICK_CONTRACT_ADDRESS_BASE`  | Yes      | BearBrick NFT contract address on Base mainnet  |
| `NEXT_PUBLIC_BEARBRICK_CONTRACT_ADDRESS_BASE_SEPOLIA` | Yes | BearBrick NFT contract address on Base Sepolia (development) |
| `NEXT_PUBLIC_BASE_RPC_URL`                     | Yes      | RPC URL for Base mainnet  |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`             | Yes      | RPC URL for Base Sepolia (development) |

## 🧱 Key Dependencies

- `@lab/farcaster-auth` – Mini-app friendly Farcaster authentication helper.
- `@lab/color-extraction` – Lightweight colour palette extraction for remote images.
- `@lab/nft-utils` – BearBrick SVG utilities and NFT helpers.
- `next`, `react`, `react-dom` – Framework core.

## 🚢 Deployment

Deploy to Vercel (or any Next.js-compatible host) as you would any standard App Router project:

```bash
npm run build
npm start
```

The project retains the Farcaster manifest redirect in `next.config.js`, so the hosted app remains linked to the existing mini-app registration.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes locally.
4. Submit a pull request describing your updates.

## 📬 Support

Open an issue in the repository or contact the BearBrick maintainers if you encounter problems. Contributions, bug reports, and design feedback are always welcome.
