import { CURRENT_NETWORK } from "./solana";

export type Network = "devnet" | "mainnet-beta";

export function currentNetwork(): Network {
  return CURRENT_NETWORK;
}

export function isMainnet(): boolean {
  return CURRENT_NETWORK === "mainnet-beta";
}

export function solscanTxUrl(sig: string): string {
  return isMainnet()
    ? `https://solscan.io/tx/${sig}`
    : `https://solscan.io/tx/${sig}?cluster=devnet`;
}

export function solscanAccountUrl(addr: string): string {
  return isMainnet()
    ? `https://solscan.io/account/${addr}`
    : `https://solscan.io/account/${addr}?cluster=devnet`;
}
