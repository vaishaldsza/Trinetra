/**
 * Pure functions for Photoplethysmogram (PPG) signal processing.
 *
 * Designed to extract pulse estimates and signal quality from color/brightness
 * intensity variations (e.g. camera sensor or photodiode).
 *
 * NOTE: Non-diagnostic health estimation only. Not a medical device.
 */

export interface PpgResult {
  bpm: number | null;
  signalQuality: number; // 0.0 to 1.0
  filteredSignal: number[];
  peaks: number[];
}

/**
 * Removes low-frequency baseline drift via local moving-average subtraction.
 */
export function detrend(signal: number[], windowSize = 15): number[] {
  if (signal.length === 0) return [];
  const half = Math.floor(windowSize / 2);
  const result = new Array<number>(signal.length);

  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(signal.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += signal[j];
    }
    const localMean = sum / (end - start);
    result[i] = signal[i] - localMean;
  }

  return result;
}

/**
 * Bandpass filter isolating cardiac frequencies (~0.7 Hz to ~3.5 Hz, corresponding to 42 - 210 BPM).
 * Implements a cascaded 1st-order high-pass + 1st-order low-pass digital filter.
 */
export function bandpassFilter(
  signal: number[],
  sampleRate: number,
  lowCutoff = 0.7,
  highCutoff = 3.5
): number[] {
  if (signal.length === 0) return [];
  const dt = 1 / sampleRate;

  // 1. High-pass filter (removes < lowCutoff Hz)
  const rcHp = 1 / (2 * Math.PI * lowCutoff);
  const alphaHp = rcHp / (rcHp + dt);
  const hpOutput = new Array<number>(signal.length);
  hpOutput[0] = signal[0];

  for (let i = 1; i < signal.length; i++) {
    hpOutput[i] = alphaHp * (hpOutput[i - 1] + signal[i] - signal[i - 1]);
  }

  // 2. Low-pass filter (removes > highCutoff Hz)
  const rcLp = 1 / (2 * Math.PI * highCutoff);
  const alphaLp = dt / (rcLp + dt);
  const lpOutput = new Array<number>(signal.length);
  lpOutput[0] = hpOutput[0];

  for (let i = 1; i < signal.length; i++) {
    lpOutput[i] = lpOutput[i - 1] + alphaLp * (hpOutput[i] - lpOutput[i - 1]);
  }

  return lpOutput;
}

/**
 * Detects systolic peaks in the filtered PPG signal using local maxima and adaptive refractory distance.
 */
export function detectPeaks(
  filteredSignal: number[],
  sampleRate: number,
  minDistanceSeconds = 0.33
): number[] {
  if (filteredSignal.length < 3) return [];

  const minDistanceSamples = Math.max(1, Math.round(minDistanceSeconds * sampleRate));
  const peaks: number[] = [];

  // Compute positive peak threshold (20% of max positive amplitude)
  let maxAmp = 0;
  for (let i = 0; i < filteredSignal.length; i++) {
    if (filteredSignal[i] > maxAmp) maxAmp = filteredSignal[i];
  }
  const threshold = Math.max(1e-4, maxAmp * 0.2);

  for (let i = 1; i < filteredSignal.length - 1; i++) {
    const val = filteredSignal[i];
    if (val > filteredSignal[i - 1] && val > filteredSignal[i + 1] && val > threshold) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistanceSamples) {
        peaks.push(i);
      } else if (val > filteredSignal[peaks[peaks.length - 1]]) {
        // Replace previous peak if current is taller within refractory window
        peaks[peaks.length - 1] = i;
      }
    }
  }

  return peaks;
}

/**
 * Calculates Heart Rate in Beats Per Minute (BPM) from peak indices.
 */
export function calculateBpm(peakIndices: number[], sampleRate: number): number | null {
  if (peakIndices.length < 2) return null;

  const validBpms: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    const deltaSeconds = (peakIndices[i] - peakIndices[i - 1]) / sampleRate;
    if (deltaSeconds > 0) {
      const instantaneousBpm = 60 / deltaSeconds;
      // Physiological filter: 42 to 210 BPM
      if (instantaneousBpm >= 42 && instantaneousBpm <= 210) {
        validBpms.push(instantaneousBpm);
      }
    }
  }

  if (validBpms.length < 2) return null;

  // Use median to resist isolated ectopic spikes
  validBpms.sort((a, b) => a - b);
  const mid = Math.floor(validBpms.length / 2);
  const medianBpm =
    validBpms.length % 2 === 0
      ? (validBpms[mid - 1] + validBpms[mid]) / 2
      : validBpms[mid];

  return Math.round(medianBpm);
}

/**
 * Estimates signal quality (0.0 to 1.0) based on signal variance and inter-beat interval regularity.
 */
export function calculateSignalQuality(
  rawSignal: number[],
  filteredSignal: number[],
  peakIndices: number[],
  sampleRate: number
): number {
  if (rawSignal.length === 0 || filteredSignal.length === 0) return 0.0;

  // 1. Raw variance check: flat signal has zero quality
  const meanRaw = rawSignal.reduce((a, b) => a + b, 0) / rawSignal.length;
  const varRaw = rawSignal.reduce((a, b) => a + Math.pow(b - meanRaw, 2), 0) / rawSignal.length;
  if (varRaw < 1e-4) return 0.0;

  // 2. Insufficient peaks indicates irregular or degraded signal
  if (peakIndices.length < 4) return 0.1;

  // 3. Rhythm regularity: compute coefficient of variation of peak-to-peak intervals
  const intervals: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    intervals.push((peakIndices[i] - peakIndices[i - 1]) / sampleRate);
  }

  const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (meanInterval <= 0) return 0.0;

  const varInterval =
    intervals.reduce((a, b) => a + Math.pow(b - meanInterval, 2), 0) / intervals.length;
  const stdInterval = Math.sqrt(varInterval);
  const cvInterval = stdInterval / meanInterval; // lower is more regular

  // 4. Amplitude consistency of detected peaks
  const peakAmps = peakIndices.map(idx => filteredSignal[idx]);
  const meanAmp = peakAmps.reduce((a, b) => a + b, 0) / peakAmps.length;
  const varAmp = peakAmps.reduce((a, b) => a + Math.pow(b - meanAmp, 2), 0) / peakAmps.length;
  const cvAmp = Math.sqrt(varAmp) / (meanAmp + 1e-6);

  // Severe penalty for irregular intervals or erratic amplitudes (typical of noise)
  if (cvInterval > 0.18 || cvAmp > 0.40) {
    return Math.max(0, Math.min(0.25, Math.round((1 - cvInterval) * 10) / 100));
  }

  const intervalScore = Math.max(0, Math.min(1, 1 - (cvInterval / 0.15)));
  const ampScore = Math.max(0, Math.min(1, 1 - (cvAmp / 0.35)));

  // 5. Bandpass energy ratio (how much of signal variance is in the cardiac band vs noise)
  const meanFiltered = filteredSignal.reduce((a, b) => a + b, 0) / filteredSignal.length;
  const varFiltered =
    filteredSignal.reduce((a, b) => a + Math.pow(b - meanFiltered, 2), 0) / filteredSignal.length;

  const energyRatio = Math.min(1, varFiltered / (varRaw + 1e-6));
  const quality = 0.5 * intervalScore + 0.3 * ampScore + 0.2 * energyRatio;

  return Math.max(0, Math.min(1, Math.round(quality * 100) / 100));
}

/**
 * Full end-to-end processing pipeline for a PPG optical buffer.
 */
export function processPpgSignal(rawSignal: number[], sampleRate = 30): PpgResult {
  // Require at least 3 seconds of sampling for reliable estimation
  if (rawSignal.length < sampleRate * 3) {
    return {
      bpm: null,
      signalQuality: 0.0,
      filteredSignal: [],
      peaks: []
    };
  }

  const detrended = detrend(rawSignal);
  const filtered = bandpassFilter(detrended, sampleRate);
  const peaks = detectPeaks(filtered, sampleRate);
  const quality = calculateSignalQuality(rawSignal, filtered, peaks, sampleRate);
  const bpm = quality >= 0.45 ? calculateBpm(peaks, sampleRate) : null;

  return {
    bpm,
    signalQuality: quality,
    filteredSignal: filtered,
    peaks
  };
}
