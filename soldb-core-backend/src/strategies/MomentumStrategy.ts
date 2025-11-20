import type {
  TradeSignal,
  MarketSnapshot,
  IStrategy,
} from "../global/types.js";
import { CONFIG } from "../config.js";

class MomentumStrategy implements IStrategy {
  private tokens = new Map<
    string,
    {
      buyPrice: number;
      buyTime: number;

      prevPrice: number;
      prevSol: number;
      prevTimestamp: number;

      initialVelocity: number;
      peakPnl: number;

      negTicks: number;
    }
  >();

  private readonly config = CONFIG.MOMENTUM;

  constructor(private logSkips = false) {}

  analyze(state: MarketSnapshot): TradeSignal {
    const mint = state.mint;
    const entry = this.tokens.get(mint);

    // =====================================================
    // ENTRY (same as before, extremely simple)
    // =====================================================
    if (!entry) {
      if (state.solInCurve < this.config.MIN_SOL)
        return { action: "SKIP", reason: "Low liquidity" };

      if (state.bondingProgress > this.config.MAX_BONDING_PROGRESS)
        return { action: "SKIP", reason: "Late bonding" };

      this.tokens.set(mint, {
        buyPrice: state.priceInSol,
        buyTime: Date.now(),

        prevPrice: state.priceInSol,
        prevSol: state.solInCurve,
        prevTimestamp: Date.now(),

        initialVelocity: 0,
        peakPnl: 0,

        negTicks: 0,
      });

      return {
        action: "BUY",
        reason: "Basic filters passed",
        suggestedAmount: 0.1,
      };
    }

    const now = Date.now();
    const elapsed = now - entry.buyTime;

    // =====================================================
    // TRUE dt (time between ticks)
    // =====================================================
    const dt = Math.max(30, now - entry.prevTimestamp); // ms
    entry.prevTimestamp = now;

    const seconds = dt / 1000;

    // =====================================================
    // Velocity calculations
    // =====================================================
    const priceVelocity = (state.priceInSol - entry.prevPrice) / seconds;
    const solVelocity = (state.solInCurve - entry.prevSol) / seconds;

    entry.prevPrice = state.priceInSol;
    entry.prevSol = state.solInCurve;

    // set initial velocity on first tick only
    if (entry.initialVelocity === 0) {
      entry.initialVelocity = priceVelocity;
    }

    // =====================================================
    // Track peak PnL
    // =====================================================
    const pnl =
      ((state.priceInSol - entry.buyPrice) / entry.buyPrice) * 100;

    entry.peakPnl = Math.max(entry.peakPnl, pnl);

    // =====================================================
    // EXIT LOGIC
    // =====================================================

    // A) Minimum hold window (prevent noise insta-sells)
    if (elapsed < this.config.MIN_HOLD_MS) {
      return {
        action: "HOLD",
        reason: "Min hold window",
      };
    }

    // B) Negative velocity must persist
    if (priceVelocity < 0) {
      entry.negTicks++;
    } else {
      entry.negTicks = 0;
    }

    if (entry.negTicks >= this.config.NEG_TICKS_REQUIRED) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: "Velocity negative for multiple ticks",
      };
    }

    // C) Velocity collapse relative to initial burst
    if (
      entry.initialVelocity > 0 &&
      priceVelocity < entry.initialVelocity * this.config.VELOCITY_FADE_THRESHOLD
    ) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: "Momentum fading fast",
      };
    }

    // D) SOL curve draining = rug micro-signal
    if (solVelocity < 0) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: "SOL curve draining",
      };
    }

    // E) Trailing stop on peak PnL drawdown
    if (pnl < entry.peakPnl - this.config.PEAK_DRAWDOWN_PERCENT) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: "PnL dropped from peak",
      };
    }

    // F) Hard timeout
    if (elapsed > this.config.MAX_HOLD_MS) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: `Timed exit after ${this.config.MAX_HOLD_MS / 1000}s`,
      };
    }

    return {
      action: "HOLD",
      reason: `Velocity ok (${priceVelocity.toFixed(3)})`,
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [mint, entry] of this.tokens.entries()) {
      if (now - entry.buyTime > 60_000) {
        this.tokens.delete(mint);
      }
    }
  }
}

export default MomentumStrategy;
