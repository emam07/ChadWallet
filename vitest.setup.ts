// Ensure no real API keys / config leak into tests.
// Market data now comes from key-less public APIs (DexScreener / GeckoTerminal),
// so only Privy's app id needs stripping.
delete process.env.NEXT_PUBLIC_PRIVY_APP_ID;
