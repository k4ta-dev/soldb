/**
 * Global configuration for the bot
 */

export const CONFIG = {
  // Polling intervals
  SNAPSHOT_POLL_INTERVAL_MS: 300,     // Faster snapshots = better velocity accuracy

  // Cleanup intervals
  CLEANUP_INTERVAL_MS: 300_000,       // 5 minutes

  // Monitor settings
  MONITOR_PING_INTERVAL_MS: 30_000,   // 30 seconds

  // Analysis mode settings
  ANALYSIS_MAX_CONCURRENT: 5,
  ANALYSIS_TARGET_TRADES: 5,
  ANALYSIS_MAX_DURATION_MS: 120_000,  // 2 minutes per token

  // Momentum Strategy (velocity-based exit)
  MOMENTUM: {
    MIN_SOL: 5,
    MAX_BONDING_PROGRESS: 20,

    // Exit logic thresholds
    MIN_HOLD_MS: 30000,                 // Short micro-hold to prevent instant noise sells
    NEG_TICKS_REQUIRED: 5,            // Require 2 consecutive negative ticks to confirm decay
    VELOCITY_FADE_THRESHOLD: 0.50,    // Velocity < 35% of initial burst = exit
    PEAK_DRAWDOWN_PERCENT: 15,        // Sell if PnL drops 20% from peak

    // Risk limit
    MAX_HOLD_MS: 30_000,              // Absolute max hold: 10 seconds
  },
} as const;

export default CONFIG;
