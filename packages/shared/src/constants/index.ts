export const APP_NAME = 'TRINETRA';
export const APP_TAGLINE = 'See the Danger. Sense the Risk. Save a Life.';

export const DEMO_BANNER_LABEL = 'DEMO MODE';
export const DEMO_SIMULATION_NOTICE = 'DEMO: All simulated data, agent activity, and alerts are marked for demonstration purposes.';

export const HEALTH_DISCLAIMER = 'NON-DIAGNOSTIC: Estimated vitals and heart-rate values are for research and reference only. Not intended for medical diagnosis or clinical use.';

export const FALL_DETECTION_DEFAULTS = {
  FREE_FALL_THRESHOLD: 0.5, // g
  IMPACT_THRESHOLD: 2.8,    // g
  INACTIVITY_THRESHOLD: 0.1, // variation
  COUNTDOWN_SECONDS: 30
};

export const SYNC_CONFIG = {
  MAX_BATCH_SIZE: 50,
  RETRY_INTERVAL_MS: 10000,
  MAX_RETRIES: 5
};
