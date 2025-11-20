/**
 * Global types shared across strategies, analysis mode, and trading bot
 */

// ==================== STRATEGY TYPES ====================

/**
 * Signal returned by any strategy's analyze() method
 */
export interface TradeSignal {
  action: "BUY" | "SELL" | "HOLD" | "SKIP";
  reason: string;
  suggestedAmount?: number;
}

/**
 * Market snapshot data for a token
 * Contains all available data points - strategies use what they need
 */
export interface MarketSnapshot {
  // Core identifiers
  mint: string;
  bondingCurve: string;
  timestamp: number;

  // Price data
  priceInSol: number;
  
  // Liquidity metrics
  solInCurve: number;
  bondingProgress: number;
  
  // Extended data (optional - populated when available)
  marketCapSol?: number;
  totalSupply?: number;
  virtualTokenReserves?: number;
  virtualSolReserves?: number;
  realTokenReserves?: number;
  realSolReserves?: number;
  
  // Volume metrics (for future strategies)
  volume24h?: number;
  txCount24h?: number;
  
  // Holder data (for future strategies)
  holderCount?: number;
  topHolderPercent?: number;
  
  // Price history (for technical analysis strategies)
  priceHistory?: PriceSnapshot[];
  
  // Optional momentum metrics (for advanced strategies)
  priceVelocity?: number;
  priceAcceleration?: number;
  solInflowVelocity?: number; // SOL added to curve per second
  buyerConcentrationScore?: number; // Measure of buyer distribution
  
  // Metadata
  [key: string]: any; // Allow additional custom fields
}

/**
 * Price snapshot for tracking history
 */
export interface PriceSnapshot {
  priceInSol: number;
  timestamp: number;
  solInCurve?: number;
  bondingProgress?: number;
}

// ==================== TRADE TYPES ====================

/**
 * Completed trade record with full details
 */
export interface Trade {
  mint: string;
  buyPrice: number;
  sellPrice: number;
  buyTime: number;
  sellTime: number;
  duration: number;
  pnl: number;
  pnlPercent: number;
  exitReason: string;
  solInCurve: number;
  bondingProgress: number;
}

/**
 * Token tracking state during monitoring
 */
export interface TokenState {
  mint: string;
  curve: string;
  strategy: any; // Will be typed as Strategy when imported
  monitoring: boolean;
  buyPrice?: number;
  buyTime?: number;
  solInCurve?: number;
  bondingProgress?: number;
}

// ==================== ANALYSIS TYPES ====================

/**
 * Investment scenario results
 */
export interface InvestmentResults {
  amount: number;
  totalProfit: number;
  finalBalance: number;
  roi: number;
  bestTrade: number;
  worstTrade: number;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  medianPnl: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgDuration: number;
  riskRewardRatio: number;
}

// ==================== TOKEN DATA ====================

/**
 * Token launch data from monitor
 */
export interface TokenData {
  mint?: string | null;
  bondingCurve?: string | null;
  timestamp?: number;
}

// ==================== STRATEGY INTERFACE ====================

/**
 * Base interface that all strategies must implement
 */
export interface IStrategy {
  /**
   * Analyze market state and return trading signal
   */
  analyze(state: MarketSnapshot): TradeSignal;

  /**
   * Cleanup old token data (optional)
   */
  cleanup?(): void;
  
  /**
   * Get strategy configuration/parameters (optional)
   */
  getConfig?(): Record<string, any>;
}

/**
 * Strategy configuration for different implementations
 */
export interface StrategyConfig {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}
