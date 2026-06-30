// Ensure no real API keys / config leak into tests. Tests that exercise the
// live BirdEye path stub BIRDEYE_API_KEY explicitly; stripping it here keeps the
// other routes on their deterministic mock-fallback path.
delete process.env.NEXT_PUBLIC_PRIVY_APP_ID;
delete process.env.BIRDEYE_API_KEY;
