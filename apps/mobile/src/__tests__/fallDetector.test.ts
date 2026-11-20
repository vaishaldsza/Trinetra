import { describe, it, expect, vi } from 'vitest';

vi.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: vi.fn().mockResolvedValue(true),
    setUpdateInterval: vi.fn(),
    addListener: vi.fn().mockReturnValue({ remove: vi.fn() })
  },
  Gyroscope: {
    isAvailableAsync: vi.fn().mockResolvedValue(true),
    setUpdateInterval: vi.fn(),
    addListener: vi.fn().mockReturnValue({ remove: vi.fn() })
  }
}));

import { FallDetector } from '../lib/fallDetector';

describe('FallDetector State Machine', () => {
  it('does not trigger a fall during normal walking', () => {
    const detector = new FallDetector();
    const callback = vi.fn();
    detector.setCallback(callback);

    let currentTime = 1000;
    // Simulate 3 seconds of walking (magnitudes fluctuating between 0.85g and 1.15g)
    for (let i = 0; i < 60; i++) {
      const z = 0.95 + 0.1 * Math.sin(i * 0.3);
      detector.processAccelerometerSample(0.1, 0.1, z, currentTime);
      currentTime += 50;
    }

    expect(callback).not.toHaveBeenCalled();
  });

  it('triggers a fall on free-fall followed by impact and stillness', () => {
    const detector = new FallDetector();
    const callback = vi.fn();
    detector.setCallback(callback);

    let currentTime = 1000;

    // 1. Initial stable state
    detector.processAccelerometerSample(0, 0, 1.0, currentTime);
    currentTime += 50;

    // 2. Free-fall phase (magnitude < 0.5g for > 120ms)
    for (let i = 0; i < 4; i++) {
      detector.processAccelerometerSample(0.1, 0.1, 0.1, currentTime); // mag ≈ 0.17g
      currentTime += 50; // total 200ms of free-fall
    }

    // 3. Impact spike (magnitude > 2.8g)
    detector.processAccelerometerSample(2.0, 2.0, 2.0, currentTime); // mag ≈ 3.46g
    currentTime += 50;

    // 4. Post-impact stillness (variance < 0.15g for > 2000ms)
    for (let i = 0; i < 42; i++) {
      detector.processAccelerometerSample(0, 0, 0.98, currentTime); // motionless on ground
      currentTime += 50; // total 2100ms
    }

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not trigger a fall when movement continues after impact', () => {
    const detector = new FallDetector();
    const callback = vi.fn();
    detector.setCallback(callback);

    let currentTime = 1000;

    // 1. Free-fall phase
    for (let i = 0; i < 4; i++) {
      detector.processAccelerometerSample(0.1, 0.1, 0.1, currentTime);
      currentTime += 50;
    }

    // 2. Impact spike
    detector.processAccelerometerSample(2.0, 2.0, 2.0, currentTime);
    currentTime += 50;

    // 3. Continued movement/scrambling (high variance > 0.15g)
    for (let i = 0; i < 42; i++) {
      const z = i % 2 === 0 ? 0.3 : 2.2; // wildly fluctuating readings
      detector.processAccelerometerSample(0.5, 0.5, z, currentTime);
      currentTime += 50;
    }

    expect(callback).not.toHaveBeenCalled();
  });
});
