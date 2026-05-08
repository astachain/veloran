import { Connection, PublicKey } from "@solana/web3.js";

export type SolanaNetwork = "devnet" | "mainnet-beta";

export const SOLANA_NETWORK = resolveNetwork(
  process.env.NEXT_PUBLIC_SOLANA_NETWORK
);

const DEFAULTS = {
  devnet: {
    rpcUrl: "https://api.devnet.solana.com",
    usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    programId: "2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS",
    treasury: "DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP",
  },
  "mainnet-beta": {
    rpcUrl: "https://api.mainnet-beta.solana.com",
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    programId: "",
    treasury: "",
  },
} satisfies Record<SolanaNetwork, Record<string, string>>;

function resolveNetwork(value: string | undefined): SolanaNetwork {
  if (!value) return "devnet";
  if (value === "devnet" || value === "mainnet-beta") return value;
  throw new Error(
    `Invalid NEXT_PUBLIC_SOLANA_NETWORK='${value}'. Use 'devnet' or 'mainnet-beta'.`
  );
}

function isUnset(value: string | undefined): boolean {
  return !value || value.trim() === "" || value.includes("PASTE_");
}

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!isUnset(value)) return value!.trim();
  if (SOLANA_NETWORK === "devnet" && fallback) return fallback;
  throw new Error(
    `Missing ${name} for ${SOLANA_NETWORK}. Refusing to boot with incomplete payment config.`
  );
}

function optionalRpcEnv(primary: string, fallbackName: string | undefined): string | undefined {
  const primaryValue = process.env[primary];
  if (!isUnset(primaryValue)) return primaryValue!.trim();
  if (fallbackName) {
    const fallbackValue = process.env[fallbackName];
    if (!isUnset(fallbackValue)) return fallbackValue!.trim();
  }
  return undefined;
}

/** Browser-side RPC URL. Keep browser keys intentionally public and scoped. */
export const PUBLIC_RPC_URL =
  optionalRpcEnv("NEXT_PUBLIC_SOLANA_RPC_URL", "NEXT_PUBLIC_HELIUS_RPC_URL") ??
  DEFAULTS[SOLANA_NETWORK].rpcUrl;

/** Server-side RPC URL. Prefer private server URL when present. */
export const SERVER_RPC_URL =
  optionalRpcEnv("SERVER_SOLANA_RPC_URL", "NEXT_PUBLIC_SOLANA_RPC_URL") ??
  PUBLIC_RPC_URL;

/** Active USDC mint for the configured network. */
export const USDC_MINT = new PublicKey(
  requiredEnv("NEXT_PUBLIC_USDC_MINT", DEFAULTS[SOLANA_NETWORK].usdcMint)
);

/** Veloran 95/5-split program for the configured network. */
export const VELORAN_PROGRAM_ID = new PublicKey(
  requiredEnv(
    "NEXT_PUBLIC_VELORAN_PROGRAM_ID",
    DEFAULTS[SOLANA_NETWORK].programId
  )
);

/** Veloran treasury wallet. Public address, not a signing secret. */
export const VELORAN_TREASURY = new PublicKey(
  requiredEnv(
    "NEXT_PUBLIC_VELORAN_TREASURY",
    process.env.VELORAN_TREASURY ?? DEFAULTS[SOLANA_NETWORK].treasury
  )
);

export const VELORAN_X402_NETWORK = `solana-${SOLANA_NETWORK}`;
export const PRIVY_SOLANA_CHAIN = `solana:${SOLANA_NETWORK}`;

let cachedConn: Connection | null = null;
export function getServerConnection(): Connection {
  if (!cachedConn) cachedConn = new Connection(SERVER_RPC_URL, "confirmed");
  return cachedConn;
}
