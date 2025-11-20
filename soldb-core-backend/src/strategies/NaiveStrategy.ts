import type {
  TradeSignal,
  MarketSnapshot,
  PriceSnapshot,
  IStrategy,
} from "../global/types.js";

interface TokenEntry {
  buyPrice: number;
  buyTime: number;
  snapshots: PriceSnapshot[];
}

/**
 * NaiveStrategy - Simple time-based strategy
 * 
 * Entry Filters:
 * - Min 3 SOL in curve (liquidity)
 * - Max 50% bonding progress
 * 
 * Exit Logic:
 * - Hold for 30 seconds
 * - Sell if price drops (any loss)
 * - Sell if +30% profit
 * - Otherwise hold and wait
 */
class NaiveStrategy implements IStrategy {
  private tokens: Map<string, TokenEntry> = new Map();

  // Entry filters
  private readonly MIN_SOL_IN_CURVE = 3;
  private readonly MAX_BONDING_PROGRESS = 50;
  
  // Exit parameters
  private readonly HOLD_DURATION_MS = 30_000; // 30 seconds

  analyze(state: MarketSnapshot): TradeSignal {
    const mint = state.mint || "unknown";

    // Check if we already bought this token FIRST
    const entry = this.tokens.get(mint);

    if (!entry) {
      // FILTER 1: Skip if not enough liquidity
      if (state.solInCurve < this.MIN_SOL_IN_CURVE) {
        return {
          action: "SKIP",
          reason: `Low liquidity (${state.solInCurve.toFixed(2)} SOL)`,
        };
      }

      // FILTER 2: Skip if bonding too high
      if (state.bondingProgress > this.MAX_BONDING_PROGRESS) {
        return {
          action: "SKIP",
          reason: `Too late (${state.bondingProgress.toFixed(1)}% bonding)`,
        };
      }

      // First time seeing this token - BUY immediately
      this.tokens.set(mint, {
        buyPrice: state.priceInSol,
        buyTime: Date.now(),
        snapshots: [{ priceInSol: state.priceInSol, timestamp: Date.now() }],
      });

      return {
        action: "BUY",
        reason: `Passed filters (${state.solInCurve.toFixed(2)} SOL, ${state.bondingProgress.toFixed(1)}% bonding)`,
        suggestedAmount: 0.1,
      };
    }

    // We own this token - add snapshot
    entry.snapshots.push({
      priceInSol: state.priceInSol,
      timestamp: Date.now(),
    });

    const elapsed = Date.now() - entry.buyTime;

    // HOLD for 30 seconds before making decision
    if (elapsed < this.HOLD_DURATION_MS) {
      const remaining = ((this.HOLD_DURATION_MS - elapsed) / 1000).toFixed(0);
      return {
        action: "HOLD",
        reason: `Holding... ${remaining}s remaining`,
      };
    }

    // After 30s, check price trend
    const currentPrice = state.priceInSol;
    const pnl = ((currentPrice - entry.buyPrice) / entry.buyPrice) * 100;

    // SELL if price is dropping
    if (pnl < 0) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: `Price down ${pnl.toFixed(1)}% after 30s - cut loss`,
      };
    }

    // SELL if good profit (1.3x+)
    if (pnl >= 30) {
      this.tokens.delete(mint);
      return {
        action: "SELL",
        reason: `Take profit at +${pnl.toFixed(1)}%`,
      };
    }

    // Still holding, price is up but not enough to sell
    return {
      action: "HOLD",
      reason: `Up ${pnl.toFixed(1)}%, waiting for 30%+ or reversal`,
    };
  }

  cleanup() {
    const now = Date.now();
    const cutoff = now - 300_000; // 5 minutes

    for (const [mint, entry] of this.tokens.entries()) {
      if (entry.buyTime < cutoff) {
        this.tokens.delete(mint);
      }
    }
  }
}

export default NaiveStrategy;
