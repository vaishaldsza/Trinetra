/**
 * TRINETRA Fall Detection Configuration
 * 
 * All acceleration values are expressed in g-force units (1g ≈ 9.81 m/s²).
 * All durations are in milliseconds unless stated otherwise.
 */

export const FALL_DETECTION_CONFIG = {
  /**
   * Free-fall threshold:
   * When a phone is dropped or a hiker starts tumbling, the net acceleration magnitude drops.
   * Magnitude < 0.5g indicates a possible free-fall or zero-gravity phase.
   */
  FREE_FALL_THRESHOLD: 0.5,

  /**
   * Minimum duration in ms the device must experience free-fall before impact.
   * Prevents standard pocket shifting or minor downward steps from falsely triggering.
   */
  MIN_FREE_FALL_DURATION_MS: 120,

  /**
   * Impact spike threshold:
   * Upon striking the ground or rocks, the sudden deceleration creates a severe acceleration spike.
   * Acceleration magnitude > 2.8g indicates a high-energy impact event.
   */
  IMPACT_THRESHOLD: 2.8,

  /**
   * Maximum allowed window (in ms) between the free-fall phase and the impact spike.
   * Typical falls take between 150ms and 800ms between loss of footing and impact.
   */
  FALL_TO_IMPACT_MAX_WINDOW_MS: 1000,

  /**
   * Post-impact inactivity variance threshold:
   * If a hiker is injured or unconscious, the phone exhibits very little motion variance.
   * Standard deviation of acceleration magnitude < 0.15g indicates inactivity.
   */
  POST_IMPACT_INACTIVITY_VARIANCE: 0.15,

  /**
   * Duration in ms to sample stillness following an impact spike.
   * 2000ms (2s) of stillness confirms lack of immediate post-fall recovery.
   */
  POST_IMPACT_OBSERVATION_WINDOW_MS: 2000,

  /**
   * Sampling interval in ms for the accelerometer and gyroscope sensors.
   * 50ms interval (20 Hz sampling) provides sufficient resolution while minimizing battery drain.
   */
  SENSOR_UPDATE_INTERVAL_MS: 50,

  /**
   * Emergency confirmation countdown window in seconds.
   * Once a potential fall pattern is confirmed, the user is given 30 seconds to dismiss the prompt.
   * If unconfirmed, the incident automatically escalates to emergency assistance.
   */
  CONFIRMATION_COUNTDOWN_SECONDS: 30
};
