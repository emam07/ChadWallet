# ChadWallet

A Solana-first trading wallet web app with a landing page and live trading interface.

## Features

- **Landing page** — token ticker banners, market preview, feature highlights, and app store links
- **Trading page** — real-time price chart (TradingView lightweight-charts), live trades feed, and swap panel via Jupiter Aggregator
- **Auth** — Sign in with Apple / Google via Privy (embedded Solana wallet created on first login)
- **Live data** — trending tokens, OHLCV candlesticks, and trade history from BirdEye API

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [lightweight-charts](https://tradingview.github.io/lightweight-charts/) (TradingView)
- [SWR](https://swr.vercel.app/) for data fetching
- [Privy](https://privy.io/) for auth + embedded wallets
- [BirdEye API](https://birdeye.so/data-api) for market data
- [Jupiter Aggregator](https://jup.ag/) for swaps

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ChadWallet.git
cd ChadWallet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your API keys:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [dashboard.privy.io](https://dashboard.privy.io) |
| `BIRDEYE_API_KEY` | [birdeye.so/data-api](https://birdeye.so/data-api) |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | [dashboard.alchemy.com](https://dashboard.alchemy.com) |

**Privy setup:**
1. Create an app at [dashboard.privy.io](https://dashboard.privy.io)
2. Enable **Google** and **Apple** login methods
3. Enable **Embedded wallets → Solana**

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy on [Vercel](https://vercel.com/) — import the repo and add the environment variables in the project settings.
