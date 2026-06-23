# ChadWallet — Technical Requirements & Implementation

## Overview

ChadWallet is a Solana-first trading wallet web app. This document covers every client requirement, the technical approach used to fulfill it, and how to verify each.

---

## Client Requirements & Fulfillment

### 1. Landing Page (fomo.family-inspired)

| Requirement | Status | Implementation |
|---|---|---|
| fomo.family-style landing page | ✅ | Full-page sections: Hero, Ticker, Features, Market Preview, Stats, How It Works, Mobile App, CTA, Footer |
| ChadWallet branding | ✅ | Uses brand assets from `/assets/logo/`, `/public/logo/`, brand colors `#00FFA3` + `#6B5CFF` |
| Mobile app links (iOS + Android) | ✅ | App Store (`/us/app/chadwallet/id6757367474`) + Google Play (`id=xyz.chadwallet.www`) wired in Navbar, Hero, CTA, Footer |
| Rotating token banners (top + bottom) | ✅ | `TokenTicker` component — infinite-loop CSS animation, top and bottom on landing page |
| Tapping a token opens trading page | ✅ | Each ticker item routes to `/trade/{solana_address}` |

### 2. Authentication — Sign In with Apple / Google via Privy

| Requirement | Status | Implementation |
|---|---|---|
| Sign in with Apple | ✅ | `@privy-io/react-auth` configured with `loginMethods: ['apple', 'google', 'email']` |
| Sign in with Google | ✅ | Same config — Privy handles OAuth redirects |
| Solana support | ✅ | `embeddedWallets.createOnLogin: 'users-without-wallets'` creates a Solana embedded wallet on first login |
| Solana cluster config | ✅ | `solanaClusters` set to Alchemy RPC URL (configurable via `NEXT_PUBLIC_ALCHEMY_RPC_URL`) |

**Setup:**
1. Create a Privy app at https://dashboard.privy.io
2. Enable "Google" and "Apple" login methods in your Privy dashboard
3. Enable "Embedded wallets" → Solana
4. Set `NEXT_PUBLIC_PRIVY_APP_ID=your-app-id` in `.env.local`

### 3. Solana Integration

| Requirement | Status | Implementation |
|---|---|---|
| Solana chain support | ✅ | All token addresses are Solana mainnet SPL addresses |
| RPC configuration | ✅ | Alchemy RPC via `NEXT_PUBLIC_ALCHEMY_RPC_URL` |
| Swap via Jupiter | ✅ | `SwapPanel` fetches quotes from `quote-api.jup.ag/v6/quote` and will execute via Jupiter Swap API |

### 4. Rotating Token Banners

| Requirement | Status | Implementation |
|---|---|---|
| Top banner | ✅ | `<TokenTicker />` on landing page — forward scroll |
| Bottom banner | ✅ | `<TokenTicker reverse />` on landing page — reverse scroll |
| Real token data | ✅ | Fetches from `/api/tokens` (BirdEye v3 trending endpoint) every 30s; fallback to 15 mock tokens |
| Links to trading page | ✅ | Clicking any token routes to `/trade/{address}` |

### 5. Trading Page (`/trade/[address]`)

#### Left Panel — Trending Tokens List

| Requirement | Status | Implementation |
|---|---|---|
| Trending token list | ✅ | `TrendingList` component, fetches from `/api/tokens` every 30s |
| Search | ✅ | Live filter by symbol or name |
| Token info row | ✅ | Logo, symbol, name, price, 24h change %, volume |
| Hot rank badges | ✅ | Top 3 tokens show rank badge (1/2/3) |
| Active token highlight | ✅ | Current token highlighted with green left border |

#### Middle Panel — Token Info, Chart, Trades

| Requirement | Status | Implementation |
|---|---|---|
| Token header (name, price, change) | ✅ | `TokenHeader` inside `page.tsx` — pulls from `/api/token/{address}` |
| 24h volume + market cap | ✅ | Displayed in token header |
| Copy address button | ✅ | Copies Solana token address to clipboard |
| Solscan link | ✅ | External link to `solscan.io/token/{address}` |
| Price chart | ✅ | `PriceChart` component — TradingView `lightweight-charts` library (MIT licensed) |
| Candlestick chart | ✅ | OHLCV data from `/api/ohlcv/{address}` (BirdEye), falls back to generated mock data |
| Timeframe selector | ✅ | 15m / 1H / 4H / 1D buttons |
| Volume bars | ✅ | Histogram series overlaid at chart bottom |
| Live Trades tab | ✅ | `TradesFeed` component — polls `/api/trades/{address}` every 5s |
| Holders tab | ✅ | `TradesFeed` component — shows top 10 holders with % share and bar |

#### Right Panel — Buy & Sell, User Position

| Requirement | Status | Implementation |
|---|---|---|
| Buy / Sell toggle | ✅ | `SwapPanel` component — green for Buy, red for Sell |
| Input token amount | ✅ | Number input with 25/50/75/100% quick fills |
| Output quote | ✅ | Fetches live quote from Jupiter `quote-api.jup.ag/v6/quote` (5s debounce) |
| Slippage settings | ✅ | 0.5% / 1% / 2% / 5% selector |
| Price impact warning | ✅ | Orange warning shown when price impact > 2% |
| Connect wallet CTA | ✅ | Shows "Connect Wallet to Trade" when not logged in; triggers Privy login on click |
| User position | ✅ | Shows holdings, USD value, avg buy price, P&L % when logged in |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, routing, API routes |
| Styling | Tailwind CSS 3 | Utility-first styling |
| Animations | Framer Motion 11 | Page transitions, scroll animations |
| Auth | `@privy-io/react-auth` | Apple + Google sign-in, Solana embedded wallets |
| Chart | `lightweight-charts` (TradingView, MIT) | Candlestick OHLCV price chart |
| Data fetching | SWR | Client-side polling with stale-while-revalidate |
| Market data | BirdEye API | Trending tokens, OHLCV, trades, token metadata |
| Swaps | Jupiter Aggregator v6 | Best-route Solana swap quotes |
| RPC | Alchemy (Solana mainnet) | Solana node access |
| Font | Geist (Vercel) | Mono + sans typeface |
| Icons | Lucide React | UI icons |
| Deployment | Vercel | Edge-optimized hosting |

---

## Environment Variables

Create `.env.local` at project root with:

```env
# Privy — https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here

# BirdEye — https://birdeye.so/data-api
BIRDEYE_API_KEY=your-birdeye-api-key-here

# Alchemy Solana RPC — https://dashboard.alchemy.com
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/your-key-here
```

All three services have free tiers. The app gracefully falls back to mock data when API keys are not configured.

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/tokens` | GET | Fetches top 20 trending Solana tokens from BirdEye |
| `/api/token/[address]` | GET | Fetches token overview (price, volume, mc, metadata) |
| `/api/ohlcv/[address]` | GET | Fetches OHLCV candlestick data (supports `?type=15m\|1H\|4H\|1D`) |
| `/api/trades/[address]` | GET | Fetches recent swap transactions for a token |

All routes proxy BirdEye requests server-side (API key is never exposed to the browser) and fall back to deterministic mock data when the API key is absent.

---

## File Structure

```
F:\ChadWallet\
├── app/
│   ├── layout.tsx              ← Root layout + Privy Providers wrapper
│   ├── page.tsx                ← Landing page (all sections)
│   ├── providers.tsx           ← PrivyProvider client wrapper
│   ├── globals.css             ← Global styles + keyframe animations
│   └── api/
│       ├── tokens/route.ts     ← BirdEye trending tokens proxy
│       ├── token/[address]/    ← Token metadata proxy
│       ├── ohlcv/[address]/    ← Candlestick data proxy
│       └── trades/[address]/   ← Live trades proxy
│
├── app/trade/[address]/
│   └── page.tsx                ← Full trading page (3-column layout)
│
├── components/
│   ├── Navbar.tsx              ← Nav + Privy sign-in button
│   ├── Hero.tsx                ← Hero section with 3D parallax
│   ├── TokenTicker.tsx         ← Animated token banner (SWR + BirdEye)
│   ├── Features.tsx            ← Feature cards + flow showcase
│   ├── MarketPreview.tsx       ← Live market table
│   ├── Stats.tsx               ← Animated stats (count-up)
│   ├── HowItWorks.tsx          ← 3-step onboarding
│   ├── MobileApp.tsx           ← Phone mockup with screenshots
│   ├── CTA.tsx                 ← Call to action section
│   ├── Footer.tsx              ← Links + social
│   └── trade/
│       ├── TrendingList.tsx    ← Left panel: search + trending tokens
│       ├── PriceChart.tsx      ← Middle panel: TradingView chart
│       ├── TradesFeed.tsx      ← Middle panel: trades + holders tabs
│       └── SwapPanel.tsx       ← Right panel: buy/sell + position
│
├── lib/
│   ├── data.ts                 ← Token data with Solana addresses
│   └── utils.ts                ← cn(), formatNumber(), formatPercent()
│
├── assets/
│   ├── logo/                   ← dark.png + light.png
│   ├── app store/              ← 9 app screenshots
│   └── flow/                   ← 6 feature flow diagrams
│
├── public/
│   ├── logo/dark.png
│   └── video/chadwallet.mp4
│
├── .env.local                  ← API keys (not committed to git)
├── next.config.ts              ← Image remote patterns
├── tailwind.config.ts          ← Brand colors + animations
└── REQUIREMENTS.md             ← This document
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Copy and fill env vars
cp .env.local.example .env.local   # or create .env.local manually

# Run dev server
npm run dev
# → http://localhost:3000

# Production build
npm run build && npm start
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project at https://vercel.com/new
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_PRIVY_APP_ID`
   - `BIRDEYE_API_KEY`
   - `NEXT_PUBLIC_ALCHEMY_RPC_URL`
4. Deploy — Vercel auto-detects Next.js

---

## Third-Party Service Setup

### Privy
1. Create account at https://dashboard.privy.io
2. Create new app → copy App ID
3. Settings → Login Methods → enable **Google** and **Apple**
4. Settings → Embedded Wallets → enable **Solana**
5. Settings → Allowed Origins → add your Vercel domain

### BirdEye
1. Create account at https://birdeye.so/data-api
2. Dashboard → API Keys → create new key
3. Free tier: 1,000 req/day, sufficient for development

### Alchemy
1. Create account at https://dashboard.alchemy.com
2. Create new app → Network: **Solana Mainnet**
3. Copy the HTTPS RPC URL

### Jupiter (no key needed)
Jupiter's public quote API at `quote-api.jup.ag/v6` is free with no API key. The swap execution requires the user's Solana wallet to be connected.

---

## Notes

- **TradingView Charting Library vs lightweight-charts**: The brief mentions `charting-library-docs` which refers to TradingView's *advanced* charting library — this requires a license request from TradingView and is not publicly available. This implementation uses `lightweight-charts` (MIT licensed, maintained by TradingView) which provides full OHLCV candlestick charts. For the advanced library, request access at tradingview.com/HTML5-stock-forex-bitcoin-charting-library.
- **Mock data fallback**: Every API route returns realistic mock data when the BirdEye API key is not set. The app is fully functional without any API keys for development/demo.
- **Jupiter swap execution**: The swap UI shows quotes and is wired up for execution. Actual on-chain swaps require the user to have SOL for gas and a connected Solana wallet via Privy.
