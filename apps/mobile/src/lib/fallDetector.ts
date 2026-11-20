import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Platform } from 'react-native';
import { FALL_DETECTION_CONFIG } from '../config/fallDetection';

type FallDetectionCallback = () => void;

enum DetectionState {
  IDLE = 'IDLE',
  FREE_FALL = 'FREE_FALL',
  IMPACT = 'IMPACT',
  OBSERVING_INACTIVITY = 'OBSERVING_INACTIVITY'
}

export class FallDetector {
  private accelSubscription: { remove: () => void } | null = null;
  private gyroSubscription: { remove: () => void } | null = null;
  private isRunning = false;
  private onFallDetectedCallback: FallDetectionCallback | null = null;

  private state: DetectionState = DetectionState.IDLE;
  private freeFallStartTime: number | null = null;
  private impactTime: number | null = null;
  private postImpactMagnitudes: number[] = [];

  public setCallback(callback: FallDetectionCallback): void {
    this.onFallDetectedCallback = callback;
  }

  public async isSensorAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const accelAvailable = await Accelerometer.isAvailableAsync();
      return accelAvailable;
    } catch {
      return false;
    }
  }

  public async start(callback: FallDetectionCallback): Promise<boolean> {
    if (this.isRunning) return true;
    this.onFallDetectedCallback = callback;
    this.resetState();

    const available = await this.isSensorAvailable();
    if (!available) {
      // Sensors unavailable (e.g. web or simulator) - gracefully keep detector ready for simulated falls
      this.isRunning = true;
      return false;
    }

    try {
      Accelerometer.setUpdateInterval(FALL_DETECTION_CONFIG.SENSOR_UPDATE_INTERVAL_MS);
      Gyroscope.setUpdateInterval(FALL_DETECTION_CONFIG.SENSOR_UPDATE_INTERVAL_MS);

      this.accelSubscription = Accelerometer.addListener((data) => {
        this.processAccelerometerSample(data.x, data.y, data.z);
      });

      this.isRunning = true;
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  public stop(): void {
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
    }
    if (this.gyroSubscription) {
      this.gyroSubscription.remove();
      this.gyroSubscription = null;
    }
    this.isRunning = false;
    this.resetState();
  }

  public triggerSimulatedFall(): void {
    if (this.onFallDetectedCallback) {
      this.onFallDetectedCallback();
    }
  }

  private resetState(): void {
    this.state = DetectionState.IDLE;
    this.freeFallStartTime = null;
    this.impactTime = null;
    this.postImpactMagnitudes = [];
  }

  public processAccelerometerSample(x: number, y: number, z: number, timestampMs?: number): void {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = timestampMs ?? Date.now();

    switch (this.state) {
      case DetectionState.IDLE:
        if (magnitude < FALL_DETECTION_CONFIG.FREE_FALL_THRESHOLD) {
          this.state = DetectionState.FREE_FALL;
          this.freeFallStartTime = now;
        }
        break;

      case DetectionState.FREE_FALL:
        if (this.freeFallStartTime) {
          const freeFallDuration = now - this.freeFallStartTime;

          // Check if sudden impact spike occurs within window
          if (magnitude > FALL_DETECTION_CONFIG.IMPACT_THRESHOLD && freeFallDuration >= FALL_DETECTION_CONFIG.MIN_FREE_FALL_DURATION_MS) {
            this.state = DetectionState.OBSERVING_INACTIVITY;
            this.impactTime = now;
            this.postImpactMagnitudes = [];
          } else if (freeFallDuration > FALL_DETECTION_CONFIG.FALL_TO_IMPACT_MAX_WINDOW_MS) {
            // Window expired without impact spike -> reset to idle
            this.resetState();
          }
        }
        break;

      case DetectionState.OBSERVING_INACTIVITY:
        if (this.impactTime) {
          this.postImpactMagnitudes.push(magnitude);
          const observationDuration = now - this.impactTime;

          if (observationDuration >= FALL_DETECTION_CONFIG.POST_IMPACT_OBSERVATION_WINDOW_MS) {
            // Calculate variance of post-impact readings
            const variance = this.calculateVariance(this.postImpactMagnitudes);
            if (variance <= FALL_DETECTION_CONFIG.POST_IMPACT_INACTIVITY_VARIANCE) {
              // Potential fall pattern verified!
              this.resetState();
              if (this.onFallDetectedCallback) {
                this.onFallDetectedCallback();
              }
            } else {
              // High movement after impact indicates intentional jump/recovery -> dismiss
              this.resetState();
            }
          }
        }
        break;
    }
  }

  private calculateVariance(samples: number[]): number {
    if (samples.length === 0) return 0;
    const mean = samples.reduce((acc, val) => acc + val, 0) / samples.length;
    const sqDiffs = samples.map((val) => Math.pow(val - mean, 2));
    return sqDiffs.reduce((acc, val) => acc + val, 0) / samples.length;
  }
}

export const fallDetector = new FallDetector();
