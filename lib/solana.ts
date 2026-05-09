import { Connection, PublicKey } from "@solana/web3.js";

export type SolanaNetwork = "devnet" | "mainnet-beta";

export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const DEVNET_VELORAN_PROGRAM_ID = "2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS";
export const DEVNET_VELORAN_TREASURY = "DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP";

const NEXT_PUBLIC_SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
const NEXT_PUBLIC_SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
const NEXT_PUBLIC_HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
const NEXT_PUBLIC_USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
const NEXT_PUBLIC_VELORAN_PROGRAM_ID = process.env.NEXT_PUBLIC_VELORAN_PROGRAM_ID;
const NEXT_PUBLIC_VELORAN_TREASURY = process.env.NEXT_PUBLIC_VELORAN_TREASURY;
const SERVER_SOLANA_RPC_URL = process.env.SERVER_SOLANA_RPC_URL;

export const SOLANA_NETWORK = resolveNetwork(NEXT_PUBLIC_SOLANA_NETWORK);
export const CURRENT_NETWORK = SOLANA_NETWORK;

const DEFAULTS = {
  devnet: {
    rpcUrl: "https://api.devnet.solana.com",
    usdcMint: DEVNET_USDC_MINT,
    programId: DEVNET_VELORAN_PROGRAM_ID,
    treasury: DEVNET_VELORAN_TREASURY,
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

function clean(value: string | undefined): string | undefined {
  return isUnset(value) ? undefined : value!.trim();
}

function requiredPublicEnv(
  name: string,
  value: string | undefined,
  fallback?: string
): string {
  const resolved = clean(value);
  if (resolved) return resolved;
  if (SOLANA_NETWORK === "devnet" && fallback) return fallback;
  throw new Error(
    `Missing ${name} for ${SOLANA_NETWORK}. Refusing to boot with incomplete payment config.`
  );
}

function optionalRpcValue(
  primary: string | undefined,
  fallback: string | undefined
): string | undefined {
  return clean(primary) ?? clean(fallback);
}

/** Browser-side RPC URL. Keep browser keys intentionally public and scoped. */
export const PUBLIC_RPC_URL =
  optionalRpcValue(NEXT_PUBLIC_SOLANA_RPC_URL, NEXT_PUBLIC_HELIUS_RPC_URL) ??
  DEFAULTS[SOLANA_NETWORK].rpcUrl;

/** Server-side RPC URL. Prefer private server URL when present. */
export const SERVER_RPC_URL = clean(SERVER_SOLANA_RPC_URL) ?? PUBLIC_RPC_URL;

/** Active USDC mint for the configured network. */
export const USDC_MINT = new PublicKey(
  requiredPublicEnv(
    "NEXT_PUBLIC_USDC_MINT",
    NEXT_PUBLIC_USDC_MINT,
    DEFAULTS[SOLANA_NETWORK].usdcMint
  )
);

/** Veloran 95/5-split program for the configured network. */
export const VELORAN_PROGRAM_ID = new PublicKey(
  requiredPublicEnv(
    "NEXT_PUBLIC_VELORAN_PROGRAM_ID",
    NEXT_PUBLIC_VELORAN_PROGRAM_ID,
    DEFAULTS[SOLANA_NETWORK].programId
  )
);

/** Veloran treasury wallet. Public address, not a signing secret. */
export const VELORAN_TREASURY = new PublicKey(
  requiredPublicEnv(
    "NEXT_PUBLIC_VELORAN_TREASURY",
    NEXT_PUBLIC_VELORAN_TREASURY,
    DEFAULTS[SOLANA_NETWORK].treasury
  )
);

export const VELORAN_X402_NETWORK = `solana-${SOLANA_NETWORK}`;
export const PRIVY_SOLANA_CHAIN = `solana:${SOLANA_NETWORK}`;

function assertMainnetConfig(): void {
  if (SOLANA_NETWORK !== "mainnet-beta") return;

  const checks = [
    ["NEXT_PUBLIC_USDC_MINT", USDC_MINT.toBase58(), DEVNET_USDC_MINT],
    [
      "NEXT_PUBLIC_VELORAN_PROGRAM_ID",
      VELORAN_PROGRAM_ID.toBase58(),
      DEVNET_VELORAN_PROGRAM_ID,
    ],
    [
      "NEXT_PUBLIC_VELORAN_TREASURY",
      VELORAN_TREASURY.toBase58(),
      DEVNET_VELORAN_TREASURY,
    ],
  ] as const;

  for (const [name, actual, devnetValue] of checks) {
    if (actual === devnetValue) {
      throw new Error(
        `Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but ${name} still points at devnet.`
      );
    }
  }

  if (PUBLIC_RPC_URL.toLowerCase().includes("devnet")) {
    throw new Error(
      "Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but public RPC points at devnet."
    );
  }

  // Browser/client bundles cannot see server-only env vars. Server-side module
  // evaluation still enforces a private non-devnet RPC before mainnet boot.
  if (typeof window === "undefined") {
    if (isUnset(SERVER_SOLANA_RPC_URL)) {
      throw new Error(
        "Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but SERVER_SOLANA_RPC_URL is unset."
      );
    }
    if (SERVER_SOLANA_RPC_URL!.toLowerCase().includes("devnet")) {
      throw new Error(
        "Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but SERVER_SOLANA_RPC_URL points at devnet."
      );
    }
  }
}

assertMainnetConfig();

let cachedConn: Connection | null = null;
export function getServerConnection(): Connection {
  if (!cachedConn) cachedConn = new Connection(SERVER_RPC_URL, "confirmed");
  return cachedConn;
}
