import * as dotenv from "dotenv";
import Monitor from "./core/monitor.js";
import Explore from "./core/explore.js";
import Strategy from "./core/strategy.js";

dotenv.config();

const explore = new Explore(process.env.MAIN_RPC!);
const strategy = new Strategy();

const monitor = new Monitor(
  process.env.MAIN_WSS!,
  process.env.MAIN_RPC!,
  false,
  async (data) => {
    if (!data.mint || !data.bondingCurve) return;

    console.log("\nNEW TOKEN:", data.mint);

    // Up to ~60 seconds of observations (120 * 500ms)
    for (let i = 0; i < 120; i++) {
      const snap = await explore.snapshot(data.mint, data.bondingCurve);

      if (snap) {
        const signal = strategy.analyze(snap);

        console.log(`[${new Date().toLocaleTimeString()}] ${signal.action}`);
        console.log(`   ${signal.reason}`);

        if (signal.action === "BUY") {
          console.log(`   Size: ${signal.suggestedAmount} SOL`);
          // trading impl - execute buy
          // Continue looping to track HOLD -> SELL
        }

        // Exit conditions
        if (signal.action === "SKIP" || signal.action === "SELL") {
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    console.log("─".repeat(50));
  }
);

monitor.start();

// Cleanup buffers every 5 minutes
setInterval(() => {
  strategy.cleanup();
  explore.cleanupHistory();
}, 300_000);