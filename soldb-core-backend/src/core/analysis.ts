import * as dotenv from "dotenv";
import Monitor from "./monitor.js";
import Explore from "./explore.js";
import Strategy from "./strategy.js";
import type {
  Trade,
  TokenState,
  InvestmentResults,
  TokenData,
} from "../global/types.js";

dotenv.config();

class AnalysisMode {
  private explore: Explore;
  private tokens: Map<string, TokenState & { running?: boolean }> = new Map();
  private trades: Trade[] = [];
  private buyCount = 0;
  private activeTokens = 0;
  private readonly MAX_CONCURRENT = 5;
  private readonly TARGET_TRADES = 5;
  private readonly INVESTMENT_AMOUNTS = [10, 20, 30, 40, 50, 100, 300, 500];

  constructor() {
    this.explore = new Explore(process.env.MAIN_RPC!);
  }

  start() {
    const monitor = new Monitor(
      process.env.MAIN_WSS!,
      process.env.MAIN_RPC!,
      false,
      async (data: TokenData) => {
        // Stop when we have enough completed trades
        if (this.trades.length >= this.TARGET_TRADES) return;
        if (!data.mint || !data.bondingCurve) return;

        if (
          !this.tokens.has(data.mint) &&
          this.activeTokens < this.MAX_CONCURRENT
        ) {
          this.tokens.set(data.mint, {
            mint: data.mint,
            curve: data.bondingCurve,
            strategy: new Strategy("momentum", true), 
            monitoring: false,
            running: false,
          });
        }

        const tokenState = this.tokens.get(data.mint);
        if (!tokenState) return;

        if (tokenState.running) return;

        tokenState.running = true;
        this.activeTokens++;
        this.monitorToken(tokenState);
      },
    );

    monitor.start();
    this.printHeader();
  }

  private async monitorToken(tokenState: TokenState & { running?: boolean }) {
    const { mint, curve, strategy } = tokenState;

    try {
      for (let i = 0; i < 240; i++) {
        // Stop if we have enough completed trades
        if (this.trades.length >= this.TARGET_TRADES) return;

        let snap;
        try {
          snap = await this.explore.snapshot(mint, curve);
        } catch {
          await this.sleep(500);
          continue;
        }

        if (!snap) {
          await this.sleep(500);
          continue;
        }

        const signal = strategy.analyze(snap);

        if (signal.action === "BUY") {
          this.buyCount++;
          
          tokenState.buyPrice = snap.priceInSol;
          tokenState.buyTime = Date.now();
          tokenState.solInCurve = snap.solInCurve;
          tokenState.bondingProgress = snap.bondingProgress;

          console.log(`[${this.timestamp()}] BUY #${this.buyCount}`);
          console.log(`  Token: ${mint}`);
          console.log(`  Price: ${snap.priceInSol.toFixed(12)} SOL`);
          console.log(`  Curve: ${snap.solInCurve.toFixed(2)} SOL`);
          console.log(`  Bonding: ${snap.bondingProgress.toFixed(1)}%\n`);
        }

        if (
          signal.action === "SELL" &&
          tokenState.buyPrice &&
          tokenState.buyTime
        ) {
          const trade: Trade = {
            mint,
            buyPrice: tokenState.buyPrice,
            sellPrice: snap.priceInSol,
            buyTime: tokenState.buyTime,
            sellTime: Date.now(),
            duration: Date.now() - tokenState.buyTime,
            pnl: snap.priceInSol - tokenState.buyPrice,
            pnlPercent:
              ((snap.priceInSol - tokenState.buyPrice) / tokenState.buyPrice) *
              100,
            exitReason: signal.reason,
            solInCurve: tokenState.solInCurve || 0,
            bondingProgress: tokenState.bondingProgress || 0,
          };

          this.trades.push(trade);
          
          // Print sell notification
          const result = trade.pnlPercent >= 0 ? "PROFIT" : "LOSS";
          const sign = trade.pnlPercent >= 0 ? "+" : "";
          console.log(`[${this.timestamp()}] SELL - ${result} (${this.trades.length}/${this.TARGET_TRADES})`);
          console.log(`  Token: ${mint}`);
          console.log(`  P&L: ${sign}${trade.pnlPercent.toFixed(2)}%`);
          console.log(`  Duration: ${(trade.duration / 1000).toFixed(0)}s`);
          console.log(`  Reason: ${trade.exitReason}\n`);
          
          return;
        }

        if (signal.action === "SKIP") return;

        await this.sleep(1000);
      }
    } finally {
      this.cleanup(mint);
      this.checkIfDone();
    }
  }

  private cleanup(mint: string) {
    const token = this.tokens.get(mint);
    if (!token) return;

    this.tokens.delete(mint);

    if (this.activeTokens > 0) this.activeTokens--;
  }

  private checkIfDone() {
    // Done when we have TARGET_TRADES completed and no active monitoring
    if (this.trades.length >= this.TARGET_TRADES && this.activeTokens === 0) {
      this.printAnalysis();
      process.exit(0);
    }
  }

  private printHeader() {
    console.log("\nAnalyzing MomentumStrategy...");
    console.log(`Target: ${this.TARGET_TRADES} trades | Max concurrent: ${this.MAX_CONCURRENT}\n`);
  }

  private printAnalysis() {
    const wins = this.trades.filter((t) => t.pnlPercent >= 0).length;
    const losses = this.trades.filter((t) => t.pnlPercent < 0).length;
    const total = this.trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

    const totalPnl = this.trades.reduce((sum, t) => sum + t.pnlPercent, 0);
    const avgPnl = total > 0 ? (totalPnl / total).toFixed(2) : "0.00";

    const avgWin =
      wins > 0
        ? (
            this.trades
              .filter((t) => t.pnlPercent >= 0)
              .reduce((sum, t) => sum + t.pnlPercent, 0) / wins
          ).toFixed(2)
        : "0.00";

    const avgLoss =
      losses > 0
        ? (
            this.trades
              .filter((t) => t.pnlPercent < 0)
              .reduce((sum, t) => sum + t.pnlPercent, 0) / losses
          ).toFixed(2)
        : "0.00";

    const avgDuration =
      total > 0
        ? (
            this.trades.reduce((sum, t) => sum + t.duration, 0) /
            total /
            1000
          ).toFixed(0)
        : "0";

    const bestTrade = Math.max(...this.trades.map((t) => t.pnlPercent));
    const worstTrade = Math.min(...this.trades.map((t) => t.pnlPercent));

    const medianPnl = this.calculateMedian(
      this.trades.map((t) => t.pnlPercent),
    );

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║                   STRATEGY ANALYSIS                    ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("OVERVIEW");
    console.log(`   Total Trades:       ${total}`);
    console.log(`   Wins / Losses:      ${wins}W / ${losses}L`);
    console.log(`   Win Rate:           ${winRate}%`);
    console.log(`   Avg Duration:       ${avgDuration}s\n`);

    console.log("PERFORMANCE METRICS");
    console.log(
      `   Total P&L:          ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}%`,
    );
    console.log(`   Average P&L:        ${avgPnl}%`);
    console.log(`   Median P&L:         ${medianPnl.toFixed(2)}%`);
    console.log(`   Average Win:        +${avgWin}%`);
    console.log(`   Average Loss:       ${avgLoss}%`);
    console.log(`   Best Trade:         +${bestTrade.toFixed(2)}%`);
    console.log(`   Worst Trade:        ${worstTrade.toFixed(2)}%`);
    console.log(
      `   Risk/Reward Ratio:  ${(Math.abs(parseFloat(avgWin)) / Math.abs(parseFloat(avgLoss))).toFixed(2)}\n`,
    );

    const investments = this.INVESTMENT_AMOUNTS.map((amount) =>
      this.calculateInvestmentResults(amount),
    );

    console.log("INVESTMENT SCENARIOS");
    investments.forEach((inv) => {
      const roi = ((inv.finalBalance - inv.amount) / inv.amount) * 100;
      console.log(`\n   Initial Investment: $${inv.amount}`);
      console.log(
        `   Total Profit/Loss:  ${inv.totalProfit >= 0 ? "+" : ""}$${inv.totalProfit.toFixed(2)}`,
      );
      console.log(`   Final Balance:      $${inv.finalBalance.toFixed(2)}`);
      console.log(
        `   ROI:                ${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`,
      );
      console.log(`   Best Trade:         +$${inv.bestTrade.toFixed(2)}`);
      console.log(
        `   Worst Trade:        -$${Math.abs(inv.worstTrade).toFixed(2)}`,
      );
    });

    console.log("\n\nTRADE DETAILS");
    console.log(
      "   #  | Token Address                                 | Result | P&L      | Duration | Reason",
    );
    console.log(
      "   ---|-----------------------------------------------|--------|----------|----------|------------------",
    );

    this.trades.forEach((trade, i) => {
      const result = trade.pnlPercent >= 0 ? "WIN " : "LOSS";
      const pnl = `${trade.pnlPercent >= 0 ? "+" : ""}${trade.pnlPercent.toFixed(2)}%`;
      const duration = `${(trade.duration / 1000).toFixed(0)}s`;
      const reason = trade.exitReason.slice(0, 18);

      console.log(
        `   ${(i + 1).toString().padStart(2)} | ${trade.mint} | ${result} | ${pnl.padStart(8)} | ${duration.padStart(8)} | ${reason}`,
      );
    });

    console.log("\n\nSTATISTICAL DISTRIBUTION");
    this.printDistribution();

    console.log("\n════════════════════════════════════════════════════════\n");
  }

  private calculateInvestmentResults(amount: number): InvestmentResults {
    let balance = amount;
    const tradeSize = amount / this.TARGET_TRADES;
    let bestTrade = 0;
    let worstTrade = 0;

    this.trades.forEach((trade) => {
      const profit = tradeSize * (trade.pnlPercent / 100);
      balance += profit;

      if (profit > bestTrade) bestTrade = profit;
      if (profit < worstTrade) worstTrade = profit;
    });

    return {
      amount,
      totalProfit: balance - amount,
      finalBalance: balance,
      roi: ((balance - amount) / amount) * 100,
      bestTrade,
      worstTrade,
    };
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;
  }

  private printDistribution() {
    const ranges = [
      { min: -Infinity, max: -20, label: "< -20%" },
      { min: -20, max: -10, label: "-20% to -10%" },
      { min: -10, max: 0, label: "-10% to 0%" },
      { min: 0, max: 10, label: "0% to +10%" },
      { min: 10, max: 20, label: "+10% to +20%" },
      { min: 20, max: 30, label: "+20% to +30%" },
      { min: 30, max: Infinity, label: "> +30%" },
    ];

    ranges.forEach((range) => {
      const count = this.trades.filter(
        (t) => t.pnlPercent > range.min && t.pnlPercent <= range.max,
      ).length;
      const percentage =
        this.trades.length > 0
          ? ((count / this.trades.length) * 100).toFixed(1)
          : "0.0";
      const bar = "█".repeat(Math.floor((count / this.trades.length) * 30));
      console.log(
        `   ${range.label.padEnd(15)} | ${count.toString().padStart(2)} (${percentage.padStart(5)}%) ${bar}`,
      );
    });
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default AnalysisMode;
