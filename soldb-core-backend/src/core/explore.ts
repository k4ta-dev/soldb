import axios from "axios";
import type { MarketSnapshot } from "../global/types.js";

interface SnapshotHistory {
  priceInSol: number;
  solInCurve: number;
  timestamp: number;
}

export class Explore {
  // Track recent snapshots per token for velocity calculations
  private history: Map<string, SnapshotHistory[]> = new Map();
  private readonly CURVE_SIG = Buffer.from([
    0x17, 0xb7, 0xf8, 0x37, 0x60, 0xd8, 0xac, 0x60,
  ]);

  private readonly TOKEN_DECIMALS = 6;
  private readonly LAMPORTS_PER_SOL = 1_000_000_000;
  private readonly INITIAL_REAL_TOKEN_RESERVES = 793_100_000_000_000n;

  constructor(private readonly rpc: string) {}

  /**
   * Get complete market snapshot for a token
   * Returns all available data points for strategies to use
   */
  async snapshot(
    mint: string,
    bondingCurve: string,
  ): Promise<MarketSnapshot | null> {
    const curve = await this.getCurveState(bondingCurve);
    if (!curve) return null;

    const now = Date.now();
    
    // Add to history
    const hist = this.history.get(mint) || [];
    hist.push({
      priceInSol: curve.priceInSol,
      solInCurve: curve.solInCurve,
      timestamp: now,
    });
    
    // Keep only last 10 seconds
    const recent = hist.filter(h => now - h.timestamp <= 10000);
    this.history.set(mint, recent);

    // Calculate momentum metrics
    const momentum = this.calculateMomentum(recent);

    return {
      // Core identifiers
      mint,
      bondingCurve,
      timestamp: now,

      // Price data
      priceInSol: curve.priceInSol,

      // Liquidity metrics
      solInCurve: curve.solInCurve,
      bondingProgress: curve.bondingProgress,

      // Extended data
      marketCapSol: curve.marketCapSol,
      totalSupply: curve.totalSupply,
      virtualTokenReserves: curve.virtualTokenReserves,
      virtualSolReserves: curve.virtualSolReserves,
      realTokenReserves: curve.realTokenReserves,
      realSolReserves: curve.realSolReserves,
      
      // Momentum metrics
      ...momentum,
    };
  }

  // -------------------------
  // Bonding Curve State
  // -------------------------

  private async getCurveState(address: string) {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      params: [
        address,
        {
          encoding: "base64",
          commitment: "confirmed",
        },
      ],
    };

    try {
      const res = await axios.post(this.rpc, body);
      const info = res?.data?.result?.value;
      if (!info?.data?.[0]) return null;

      const buf = Buffer.from(info.data[0], "base64");
      if (!buf.subarray(0, 8).equals(this.CURVE_SIG)) return null;

      const virtualToken = buf.readBigUInt64LE(0x08);
      const virtualSol = buf.readBigUInt64LE(0x10);
      const realToken = buf.readBigUInt64LE(0x18);
      const realSol = buf.readBigUInt64LE(0x20);
      const totalSupply = buf.readBigUInt64LE(0x28);

      const vt = Number(virtualToken) / 10 ** this.TOKEN_DECIMALS;
      const vs = Number(virtualSol) / this.LAMPORTS_PER_SOL;
      const rt = Number(realToken) / 10 ** this.TOKEN_DECIMALS;
      const rs = Number(realSol) / this.LAMPORTS_PER_SOL;

      const price = vs / vt;

      const supplyFloat = Number(totalSupply) / 10 ** this.TOKEN_DECIMALS;
      const mcap = price * supplyFloat;

      // Progress = how much has been sold from initial reserves
      const progress =
        realToken >= this.INITIAL_REAL_TOKEN_RESERVES
          ? 0
          : 1 - Number(realToken) / Number(this.INITIAL_REAL_TOKEN_RESERVES);

      return {
        priceInSol: price,
        marketCapSol: mcap,
        bondingProgress: Math.min(progress * 100, 100),
        solInCurve: rs,
        totalSupply: supplyFloat,
        virtualTokenReserves: vt,
        virtualSolReserves: vs,
        realTokenReserves: rt,
        realSolReserves: rs,
      };
    } catch {
      return null;
    }
  }

  // -------------------------
  // Momentum Calculations
  // -------------------------

  private calculateMomentum(history: SnapshotHistory[]) {
    if (history.length < 2) {
      return {
        priceVelocity: 0,
        priceAcceleration: 0,
        solInflowVelocity: 0,
      };
    }

    // Get recent snapshots
    const latest = history[history.length - 1]!;
    const prev = history[history.length - 2]!;
    
    // Time delta in seconds
    const dt = (latest.timestamp - prev.timestamp) / 1000;
    if (dt === 0) return { priceVelocity: 0, priceAcceleration: 0, solInflowVelocity: 0 };

    // Price velocity (price change per second)
    const priceVelocity = (latest.priceInSol - prev.priceInSol) / dt;

    // Price acceleration (if we have 3+ points)
    let priceAcceleration = 0;
    if (history.length >= 3) {
      const prev2 = history[history.length - 3]!;
      const dt2 = (prev.timestamp - prev2.timestamp) / 1000;
      if (dt2 > 0) {
        const prevVelocity = (prev.priceInSol - prev2.priceInSol) / dt2;
        priceAcceleration = (priceVelocity - prevVelocity) / dt;
      }
    }

    // SOL inflow velocity (SOL added to curve per second)
    const solInflowVelocity = (latest.solInCurve - prev.solInCurve) / dt;

    return {
      priceVelocity,
      priceAcceleration,
      solInflowVelocity,
    };
  }

  /**
   * Cleanup old history (call periodically)
   */
  cleanupHistory() {
    const now = Date.now();
    const cutoff = now - 60000; // Keep last 60s

    for (const [mint, hist] of this.history.entries()) {
      const filtered = hist.filter(h => h.timestamp > cutoff);
      if (filtered.length === 0) {
        this.history.delete(mint);
      } else {
        this.history.set(mint, filtered);
      }
    }
  }
}

export default Explore;
