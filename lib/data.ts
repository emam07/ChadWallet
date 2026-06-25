export interface Token {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  color: string;
}

// Curated universe of real Solana mints. Addresses are verified against
// DexScreener/GeckoTerminal; the price/change/volume/marketCap fields are a
// point-in-time snapshot used ONLY as a last-resort fallback when every live
// market API is unreachable. In normal operation these rows are re-priced live
// (see app/api/tokens/route.ts), so the static numbers below are never shown.
export const tokens: Token[] = [
  { symbol: "SOL", name: "Solana", address: "So11111111111111111111111111111111111111112", price: 187.42, change: 8.34, volume: 2_840_000_000, marketCap: 88_100_000_000, color: "#9945FF" },
  { symbol: "BONK", name: "Bonk", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", price: 0.0000342, change: 24.71, volume: 412_000_000, marketCap: 2_280_000_000, color: "#F7931A" },
  { symbol: "WIF", name: "dogwifhat", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", price: 2.14, change: 12.45, volume: 890_000_000, marketCap: 2_130_000_000, color: "#FF6B6B" },
  { symbol: "JUP", name: "Jupiter", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", price: 1.23, change: -3.21, volume: 320_000_000, marketCap: 1_600_000_000, color: "#1BE999" },
  { symbol: "PYTH", name: "Pyth Network", address: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", price: 0.487, change: 5.67, volume: 180_000_000, marketCap: 690_000_000, color: "#E6DAFE" },
  { symbol: "JTO", name: "Jito", address: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL", price: 2.48, change: 4.1, volume: 90_000_000, marketCap: 760_000_000, color: "#4DA2FF" },
  { symbol: "RAY", name: "Raydium", address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", price: 2.89, change: 9.11, volume: 220_000_000, marketCap: 870_000_000, color: "#2775CA" },
  { symbol: "RENDER", name: "Render", address: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof", price: 1.54, change: -2.86, volume: 25_000_000, marketCap: 800_000_000, color: "#FF4E2B" },
  { symbol: "ORCA", name: "Orca", address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", price: 4.21, change: -1.88, volume: 95_000_000, marketCap: 412_000_000, color: "#00C2FF" },
  { symbol: "POPCAT", name: "Popcat", address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", price: 0.921, change: 41.3, volume: 560_000_000, marketCap: 920_000_000, color: "#FF8C94" },
  { symbol: "TRUMP", name: "OFFICIAL TRUMP", address: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN", price: 1.7, change: -1.02, volume: 280_000_000, marketCap: 1_700_000_000, color: "#D4AF37" },
  { symbol: "PENGU", name: "Pudgy Penguins", address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", price: 0.006074, change: -1.73, volume: 120_000_000, marketCap: 380_000_000, color: "#5FC8F0" },
  { symbol: "FARTCOIN", name: "Fartcoin", address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", price: 0.1227, change: -4.88, volume: 80_000_000, marketCap: 122_000_000, color: "#8FBF6F" },
  { symbol: "MOODENG", name: "Moo Deng", address: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY", price: 0.03783, change: -1.79, volume: 30_000_000, marketCap: 37_000_000, color: "#F2A65A" },
  { symbol: "GRASS", name: "Grass", address: "Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs", price: 0.4772, change: 7.32, volume: 20_000_000, marketCap: 290_000_000, color: "#7BC950" },
  { symbol: "MEME", name: "Memecoin", address: "MEMEvQpqMVCBxkBSNBfq9XHHmcFbpwzCHkWCsUnz7XS", price: 0.031, change: 67.42, volume: 780_000_000, marketCap: 310_000_000, color: "#FFD700" },
  { symbol: "BOME", name: "Book of Meme", address: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82", price: 0.0128, change: 18.6, volume: 340_000_000, marketCap: 530_000_000, color: "#98FF98" },
  { symbol: "MEW", name: "cat in a dogs world", address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5", price: 0.00812, change: 29.4, volume: 280_000_000, marketCap: 490_000_000, color: "#DDA0DD" },
  { symbol: "WEN", name: "Wen", address: "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk", price: 0.000004828, change: -2.86, volume: 12_000_000, marketCap: 3_500_000, color: "#FFB6C1" },
  { symbol: "SAMO", name: "Samoyedcoin", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", price: 0.022, change: 34.2, volume: 60_000_000, marketCap: 140_000_000, color: "#F0A500" },
  { symbol: "ATLAS", name: "Star Atlas", address: "ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx", price: 0.0071, change: -6.3, volume: 45_000_000, marketCap: 95_000_000, color: "#A78BFA" },
  { symbol: "MNGO", name: "Mango", address: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac", price: 0.058, change: 15.9, volume: 72_000_000, marketCap: 180_000_000, color: "#FFB347" },
];

export const marketTokens: Token[] = tokens.slice(0, 8);
