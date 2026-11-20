import { describe, it, expect } from 'vitest';
import { processPpgSignal } from '../lib/ppg';

describe('Photoplethysmogram (PPG) Signal Processing', () => {
  it('accurately computes 70-74 BPM on a synthetic 72 BPM sine + noise signal', () => {
    const sampleRate = 30; // 30 Hz standard camera frame rate
    const durationSeconds = 10;
    const totalSamples = sampleRate * durationSeconds;
    const targetBpm = 72;
    const targetFreqHz = targetBpm / 60; // 1.2 Hz

    const syntheticSignal = new Array<number>(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      // Cardiac fundamental sine wave + low frequency baseline drift + high frequency jitter
      const cardiacWave = Math.sin(2 * Math.PI * targetFreqHz * t);
      const baselineDrift = 0.1 * Math.sin(2 * Math.PI * 0.1 * t);
      const noise = 0.05 * Math.sin(2 * Math.PI * 12 * t);
      syntheticSignal[i] = cardiacWave + baselineDrift + noise;
    }

    const result = processPpgSignal(syntheticSignal, sampleRate);

    expect(result.bpm).not.toBeNull();
    expect(result.bpm).toBeGreaterThanOrEqual(70);
    expect(result.bpm).toBeLessThanOrEqual(74);
    expect(result.signalQuality).toBeGreaterThan(0.6);
  });

  it('rejects a flat signal with zero/low quality and no BPM', () => {
    const sampleRate = 30;
    const flatSignal = new Array<number>(300).fill(120.0);

    const result = processPpgSignal(flatSignal, sampleRate);

    expect(result.bpm).toBeNull();
    expect(result.signalQuality).toBeLessThan(0.35);
  });

  it('rejects an uncorrelated noisy signal with low quality and no BPM', () => {
    const sampleRate = 30;
    // Pseudo-random white noise generated with a linear congruential generator (no periodicity)
    const noisySignal = new Array<number>(300);
    let seed = 42;
    for (let i = 0; i < 300; i++) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      noisySignal[i] = (seed / 4294967296) * 100 - 50;
    }

    const result = processPpgSignal(noisySignal, sampleRate);

    expect(result.bpm).toBeNull();
    expect(result.signalQuality).toBeLessThan(0.35);
  });
});
