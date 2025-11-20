import WebSocket from "ws";
import axios from "axios";
import type { TokenData } from "../global/types.js";

interface InternalTokenData {
  mint: string | null;
  mintAuthority: string | null;
  bondingCurve: string | null;
  associatedBondingCurve: string | null;
  global: string | null;
  metadata: string | null;
  creator: string | null;
  signature: string;
  timestamp: number;
}

class Monitor {
  private ws: WebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscriptionId: number | null = null;
  private readonly PUMP_FUN_PROGRAM_ID =
    "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

  constructor(
    private readonly wss: string,
    private readonly rpc: string,
    private readonly log: boolean = false,
    private readonly onTokenLaunch?: (data: TokenData) => void,
  ) {}

  start() {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.wss);

    this.ws.on("open", () => this.handleOpen());
    this.ws.on("message", (raw) => this.handleMessage(raw));
    this.ws.on("close", () => this.handleClose());
    this.ws.on("error", (err) => this.handleError(err));
  }

  private handleOpen() {
    const subscription = {
      jsonrpc: "2.0",
      id: 1,
      method: "logsSubscribe",
      params: [
        { mentions: [this.PUMP_FUN_PROGRAM_ID] },
        { commitment: "processed" },
      ],
    };

    this.ws?.send(JSON.stringify(subscription));
    console.log("[WS] Subscribed");

    this.pingInterval = setInterval(() => {
      this.ws?.ping();
    }, 30_000);
  }

  private handleMessage(raw: WebSocket.Data) {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch (err: any) {
      console.error("[WS] Json parse error:", err);
      return;
    }

    if (!data) return;

    if (data.id === 1 && data.result) {
      this.subscriptionId = data.result;
      console.log("[WS] subscription id =", this.subscriptionId);
      return;
    }

    const val = data?.params?.result?.value;
    const ctx = data?.params?.result?.context;
    if (!val) return;

    const event = {
      slot: ctx.slot,
      signature: val.signature,
      err: val.err,
      logs: val.logs || [],
      timestamp: Date.now(),
    };

    const instructionType = this.detectInstruction(event.logs);
    
    if (instructionType === "create") {
      this.decodeTxn(event.signature);
    }
  }

  private handleClose() {
    console.log("[WS] closed");
    if (this.pingInterval) clearInterval(this.pingInterval);
    setTimeout(() => this.connect(), 1000);
  }

  private handleError(err: Error) {
    console.error("[WS] error:", err.message);
  }

  private detectInstruction(logs: string[]): "create" | null {
    for (let i = 0; i < logs.length - 1; i++) {
      const line = logs[i];
      const next = logs[i + 1];

      if (
        line!.includes(`Program ${this.PUMP_FUN_PROGRAM_ID} invoke`) &&
        next!.includes("Program log: Instruction: Create")
      ) {
        return "create";
      }
    }
    return null;
  }

  private async decodeTxn(signature: string) {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      ],
    };

    let res;
    try {
      res = await axios.post(this.rpc, body, { timeout: 8000 });
    } catch (err: any) {
      console.error("RPC error:", err.message);
      return null;
    }

    const result = res?.data?.result;
    if (!result) {
      // console.warn("Transaction not found:", signature);
      return null;
    }

    const message = result?.transaction?.message;
    if (!message) {
      console.warn("Missing transaction.message:", signature);
      return null;
    }

    // Handle both legacy and versioned transaction formats
    let keys: string[] = [];
    if (Array.isArray(message.accountKeys)) {
      keys = message.accountKeys.map((k: any) =>
        typeof k === "string" ? k : k?.pubkey || null,
      );
    } else if (message.staticAccountKeys) {
      // Versioned transaction format
      keys = [
        ...message.staticAccountKeys,
        ...(message.addressTableLookups?.flatMap((lookup: any) => [
          ...(lookup.writableIndexes?.map((i: number) => lookup.accountKey) ||
            []),
          ...(lookup.readonlyIndexes?.map((i: number) => lookup.accountKey) ||
            []),
        ]) || []),
      ];
    }

    if (keys.length === 0) {
      console.warn("Missing accountKeys:", signature);
      return null;
    }

    const ix = message.instructions.find((ix: any) => {
      const pid = keys[ix.programIdIndex];
      return pid === this.PUMP_FUN_PROGRAM_ID;
    });

    if (!ix) {
      console.warn("No Pump.fun instruction in tx:", signature);
      return null;
    }

    const getKey = (i: number) => {
      const idx = ix.accounts[i];
      return keys[idx] || null;
    };

    const data: InternalTokenData = {
      mint: getKey(0),
      mintAuthority: getKey(1),
      bondingCurve: getKey(2),
      associatedBondingCurve: getKey(3),
      global: getKey(4),
      metadata: getKey(6),
      creator: getKey(7),
      signature,
      timestamp: Date.now(),
    };

    if (this.log) this.prettyLog(data);

    // Convert to simpler TokenData for callback
    const tokenData: TokenData = {
      mint: data.mint,
      bondingCurve: data.bondingCurve,
      timestamp: data.timestamp,
    };

    if (this.onTokenLaunch) this.onTokenLaunch(tokenData);

    return data;
  }


  private prettyLog(info: Record<string, any>) {
    const pad = (k: string) => k.padEnd(18, " ");

    console.log("\n===== Pump.fun Launch Detected =====");
    for (const [key, value] of Object.entries(info)) {
      console.log(`${pad(key)}: ${value ?? "null"}`);
    }
    console.log("====================================\n");
  }
}

export default Monitor;
