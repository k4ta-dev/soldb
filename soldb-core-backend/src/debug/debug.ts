import * as dotenv from "dotenv";
import Monitor from "../core/monitor.js";
import Explore from "../core/explore.js";
import Strategy from "../core/strategy.js";
import { CONFIG } from "../config.js";

dotenv.config();

const POLL_MS = CONFIG.SNAPSHOT_POLL_INTERVAL_MS;
const explore = new Explore(process.env.MAIN_RPC!);
const strategy = new Strategy("momentum", false);

const monitor = new Monitor(
  process.env.MAIN_WSS!,
  process.env.MAIN_RPC!,
  false,
  async (data) => {
    if (!data.mint || !data.bondingCurve) return;

    console.log(`\nTOKEN: ${data.mint}`);

    for (let i = 0; i < 60; i++) {
      const snap = await explore.snapshot(data.mint, data.bondingCurve);
      if (!snap) {
        await sleep(POLL_MS);
        continue;
      }

      const signal = strategy.analyze(snap);
      const v = snap.priceVelocity?.toFixed(8) ?? "N/A";

      if (signal.action === "SKIP") {
        console.log(`SKIP: ${signal.reason}\n`);
        break;
      }

      if (signal.action === "BUY") {
        console.log(`BUY: ${signal.reason}`);
      }

      if (signal.action === "HOLD") {
        console.log(`v=${v} | ${signal.reason}`);
      }

      if (signal.action === "SELL") {
        console.log(`SELL: ${signal.reason}\n`);
        process.exit(0);
      }

      await sleep(POLL_MS);
    }
  }
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

monitor.start();
