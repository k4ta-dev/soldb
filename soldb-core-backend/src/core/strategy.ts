import type {
  TradeSignal,
  MarketSnapshot,
  IStrategy,
} from "../global/types.js";

// Import available strategies
import NaiveStrategy from "../strategies/NaiveStrategy.js";
import MomentumStrategy from "../strategies/MomentumStrategy.js";

/**
 * Main Strategy class - Acts as a facade for different strategy implementations
 * 
 * Usage:
 *   const strategy = new Strategy("naive");
 *   const strategy = new Strategy("momentum");
 *   const signal = strategy.analyze(marketSnapshot);
 */
class Strategy implements IStrategy {
  private implementation: IStrategy;

  constructor(strategyName: string = "naive", logSkips: boolean = false) {
    // Select strategy implementation
    switch (strategyName.toLowerCase()) {
      case "naive":
        this.implementation = new NaiveStrategy();
        break;
      case "momentum":
        this.implementation = new MomentumStrategy(logSkips);
        break;
      default:
        console.warn(`Unknown strategy "${strategyName}", using NaiveStrategy`);
        this.implementation = new NaiveStrategy();
    }
  }

  /**
   * Analyze market state and return trading signal
   */
  analyze(state: MarketSnapshot): TradeSignal {
    return this.implementation.analyze(state);
  }

  /**
   * Cleanup old token data (optional)
   */
  cleanup(): void {
    if (this.implementation.cleanup) {
      this.implementation.cleanup();
    }
  }

  /**
   * Get the name of the current strategy implementation
   */
  getStrategyName(): string {
    return this.implementation.constructor.name;
  }
}

export default Strategy;
