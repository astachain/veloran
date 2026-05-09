import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { prisma } from "@/lib/db";
import { currentNetwork } from "@/lib/network";

export async function GET() {
  const status = {
    app: "ok" as const,
    db: "fail" as "ok" | "fail",
    rpc: "fail" as "ok" | "fail",
    network: currentNetwork(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.db = "ok";
  } catch {}

  try {
    const rpcUrl =
      process.env.SERVER_SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (rpcUrl) {
      const conn = new Connection(rpcUrl, "confirmed");
      await conn.getLatestBlockhash();
      status.rpc = "ok";
    }
  } catch {}

  // Always 200 — clients read body. Use /api/ready later if you need
  // HTTP-coded readiness for monitoring.
  return NextResponse.json(status);
}
