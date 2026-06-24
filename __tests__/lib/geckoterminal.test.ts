import { describe, it, expect } from 'vitest';
import { dedupeByTime, type Candle } from '@/lib/geckoterminal';

function candle(time: number, close: number): Candle {
  return { time, open: close, high: close, low: close, close, volume: 1 };
}

describe('dedupeByTime', () => {
  it('returns the input unchanged when all timestamps are unique', () => {
    const input = [candle(1, 10), candle(2, 20), candle(3, 30)];
    expect(dedupeByTime(input)).toEqual(input);
  });

  it('collapses repeated timestamps, keeping the last occurrence', () => {
    const input = [candle(1, 10), candle(2, 20), candle(2, 25), candle(3, 30)];
    const out = dedupeByTime(input);
    expect(out.map((c) => c.time)).toEqual([1, 2, 3]);
    // The duplicate at time=2 keeps the later (freshest) close.
    expect(out.find((c) => c.time === 2)?.close).toBe(25);
  });

  it('collapses runs of more than two duplicates', () => {
    const input = [candle(5, 1), candle(5, 2), candle(5, 3)];
    const out = dedupeByTime(input);
    expect(out).toHaveLength(1);
    expect(out[0].close).toBe(3);
  });

  it('produces strictly-ascending, unique timestamps (lightweight-charts invariant)', () => {
    const input = [candle(1, 1), candle(1, 1), candle(2, 2), candle(2, 2), candle(3, 3)];
    const out = dedupeByTime(input);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].time).toBeGreaterThan(out[i - 1].time);
    }
  });

  it('handles an empty array', () => {
    expect(dedupeByTime([])).toEqual([]);
  });
});
