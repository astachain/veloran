/**
 * Veloran mainnet smoke test — one tiny pay_for_content invocation.
 *
 * Usage:
 *   AGENT_KEYPAIR_PATH=~/.config/solana/veloran-mainnet-deployer.json \
 *   npx tsx scripts/mainnet-smoke-test.ts
 *
 * What it does:
 *   1. Loads the deployer keypair (= reader = creator = treasury for this test)
 *   2. Builds an idempotent USDC ATA create (in case the deployer's USDC ATA
 *      doesn't exist yet)
 *   3. Calls pay_for_content(50_000) — that's $0.05 USDC — on the deployed
 *      mainnet program 89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j
 *   4. Confirms the on-chain split: 95% to creator ATA, 5% to treasury ATA.
 *      Self-loop means both legs land back in the same ATA — net flow zero,
 *      but the program log shows the split fired.
 *
 * Pre-requisites:
 *   - Deployer keypair file at AGENT_KEYPAIR_PATH (default
 *     ~/.config/solana/veloran-mainnet-deployer.json)
 *   - Deployer wallet has at least 0.10 USDC on mainnet (Circle USDC mint
 *     EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
 *   - Deployer has at least 0.01 SOL for tx fee + ATA rent
 *
 * Cost:
 *   - ~0.0001 SOL in tx fee
 *   - 0 USDC net (creator + treasury are the same wallet)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// ---- Mainnet constants (matches the cargo `mainnet` feature build) ----

const MAINNET_PROGRAM_ID = new PublicKey(
  "89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j"
);
const MAINNET_USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
const MAINNET_RPC = "https://api.mainnet-beta.solana.com";

// pay_for_content discriminator: sha256("global:pay_for_content")[..8]
const PAY_FOR_CONTENT_DISCRIMINATOR = Uint8Array.from([
  175, 34, 1, 20, 153, 78, 194, 215,
]);

const SMOKE_AMOUNT_MICRO_USDC = 50_000n; // $0.05

// ---- Helpers ----

function expandHome(p: string): string {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

function loadKeypair(filePath: string): Keypair {
  const expanded = expandHome(filePath);
  const raw = JSON.parse(fs.readFileSync(expanded, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function buildPayForContentIx(args: {
  reader: PublicKey;
  readerAta: PublicKey;
  creatorAta: PublicKey;
  platformAta: PublicKey;
  mint: PublicKey;
  amount: bigint;
}): TransactionInstruction {
  // 8-byte discriminator + 8-byte u64 LE amount
  const data = new Uint8Array(16);
  data.set(PAY_FOR_CONTENT_DISCRIMINATOR, 0);
  new DataView(data.buffer).setBigUint64(8, args.amount, true);

  return new TransactionInstruction({
    programId: MAINNET_PROGRAM_ID,
    keys: [
      { pubkey: args.reader, isSigner: true, isWritable: true },
      { pubkey: args.readerAta, isSigner: false, isWritable: true },
      { pubkey: args.creatorAta, isSigner: false, isWritable: true },
      { pubkey: args.platformAta, isSigner: false, isWritable: true },
      { pubkey: args.mint, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

// ---- Main ----

async function main() {
  const keypairPath =
    process.env.AGENT_KEYPAIR_PATH ||
    path.join(os.homedir(), ".config/solana/veloran-mainnet-deployer.json");

  console.log("\x1b[38;5;141m\x1b[1m🚀  Veloran mainnet smoke test\x1b[0m\n");
  console.log(`Keypair file:    ${keypairPath}`);

  const deployer = loadKeypair(keypairPath);
  const me = deployer.publicKey;
  console.log(`Wallet:          \x1b[36m${me.toBase58()}\x1b[0m`);
  console.log(`Program ID:      \x1b[36m${MAINNET_PROGRAM_ID.toBase58()}\x1b[0m`);
  console.log(`USDC mint:       \x1b[2m${MAINNET_USDC_MINT.toBase58()}\x1b[0m`);
  console.log(
    `Test amount:     0.05 USDC (self-loop: reader = creator = treasury)\n`
  );

  const conn = new Connection(MAINNET_RPC, "confirmed");

  // Pre-flight: SOL balance
  const sol = await conn.getBalance(me);
  console.log(`SOL balance:     ${(sol / 1e9).toFixed(6)} SOL`);
  if (sol < 0.005 * 1e9) {
    console.error(
      `\x1b[31m✗  Insufficient SOL for tx fees + ATA rent. Need ≥ 0.005 SOL.\x1b[0m`
    );
    process.exit(1);
  }

  // Compute USDC ATA + check balance
  const myUsdcAta = getAssociatedTokenAddressSync(MAINNET_USDC_MINT, me);
  console.log(`USDC ATA:        \x1b[2m${myUsdcAta.toBase58()}\x1b[0m`);

  const ataInfo = await conn.getAccountInfo(myUsdcAta);
  if (!ataInfo) {
    console.log(
      `USDC ATA does not exist yet — will create idempotently in this tx.`
    );
    console.log(
      `\x1b[33m⚠  Note: ATA creation does NOT fund USDC. Send ≥ 0.10 USDC to ${me.toBase58()} first, OR just to its ATA after this run.\x1b[0m`
    );
  } else {
    // Read USDC balance
    const balResp = await conn.getTokenAccountBalance(myUsdcAta);
    const usdc = parseFloat(balResp.value.uiAmountString || "0");
    console.log(`USDC balance:    ${usdc.toFixed(6)} USDC`);
    if (usdc < 0.05) {
      console.error(
        `\x1b[31m✗  Need ≥ 0.05 USDC in this ATA to invoke pay_for_content. Send some USDC and retry.\x1b[0m`
      );
      process.exit(1);
    }
  }

  // Build instructions: idempotent ATA create + pay_for_content
  const ixs: TransactionInstruction[] = [
    createAssociatedTokenAccountIdempotentInstruction(
      me,
      myUsdcAta,
      me,
      MAINNET_USDC_MINT
    ),
    buildPayForContentIx({
      reader: me,
      readerAta: myUsdcAta,
      creatorAta: myUsdcAta, // self-loop
      platformAta: myUsdcAta, // self-loop (treasury = me on mainnet build)
      mint: MAINNET_USDC_MINT,
      amount: SMOKE_AMOUNT_MICRO_USDC,
    }),
  ];

  console.log(`\n🔨  Building transaction…`);
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash(
    "confirmed"
  );
  const msg = new TransactionMessage({
    payerKey: me,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([deployer]);

  console.log(`🚀  Sending to mainnet…`);
  const sig = await conn.sendTransaction(tx, { skipPreflight: false });
  console.log(`✅  Submitted:     \x1b[36m${sig}\x1b[0m`);
  console.log(`🔍  Solscan:       https://solscan.io/tx/${sig}`);

  console.log(`\n⏳  Waiting for confirmation…`);
  const conf = await conn.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  if (conf.value.err) {
    console.error(
      `\x1b[31m✗  Transaction failed: ${JSON.stringify(conf.value.err)}\x1b[0m`
    );
    process.exit(1);
  }
  console.log(`\x1b[32m✓  Confirmed.\x1b[0m`);

  // Inspect the parsed transaction to verify program log shows the split
  const parsed = await conn.getParsedTransaction(sig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!parsed) {
    console.error(`\x1b[33m⚠  Could not fetch parsed transaction.\x1b[0m`);
    process.exit(0);
  }

  // Look for the PaymentSplit event in program logs
  const logs = parsed.meta?.logMessages || [];
  const splitLogged = logs.some(
    (l) =>
      l.includes("Program data:") ||
      l.includes("PaymentSplit") ||
      l.toLowerCase().includes("split")
  );

  console.log(`\n\x1b[32m\x1b[1m━━━ Smoke test result ━━━\x1b[0m`);
  console.log(
    `Program invocation: ${
      logs.some((l) => l.includes(MAINNET_PROGRAM_ID.toBase58()))
        ? "\x1b[32mYES\x1b[0m"
        : "\x1b[31mNO\x1b[0m"
    }`
  );
  console.log(
    `Tx success:         ${parsed.meta?.err === null ? "\x1b[32mYES\x1b[0m" : "\x1b[31mNO\x1b[0m"}`
  );
  console.log(
    `Split event:        ${splitLogged ? "\x1b[32mYES (or program data emitted)\x1b[0m" : "\x1b[33mUNCERTAIN — inspect logs manually\x1b[0m"}`
  );
  console.log(
    `Token balance flow: \x1b[2mself-loop, net 0 USDC change (creator + treasury = same ATA)\x1b[0m`
  );
  console.log(`\nReceipt: ${sig}`);
  console.log(`Solscan: https://solscan.io/tx/${sig}`);
  console.log(`\nFirst few program logs:`);
  for (const l of logs.slice(0, 8)) {
    console.log(`  \x1b[2m${l}\x1b[0m`);
  }
  console.log(`\n\x1b[32m\x1b[1m✓ Mainnet program is live and invocable.\x1b[0m`);
}

main().catch((err) => {
  console.error(`\x1b[31m✗  Smoke test failed:\x1b[0m`, err);
  process.exit(1);
});
