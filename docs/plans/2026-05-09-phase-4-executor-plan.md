# Veloran Phase 4 — Executor Playbook

**For:** the coding agent executing Phase 4 hardening
**Repo:** `https://github.com/astachain/veloran`
**Working dir:** `/root/veloran-astachain-clean` (VPS) or local clone of `astachain/veloran`
**Branch:** `main`
**Reference plan:** `docs/plans/2026-05-09-phase-4-hardening.md` (the brief)
**Production alias:** `https://veloran-paywall-sage.vercel.app`
**Last reference commit (per brief):** `9627a18 fix: use server payment memo for intent-bound payments`

---

## Read this before you start

1. **No secrets in chat, commits, or logs.** Use `[REDACTED]` for DB URLs, API keys, Privy secrets, Vercel tokens, Helius keys, raw `.env.local`.
2. **Devnet stays default.** Mainnet only after Tasks 1-7 pass + explicit user "go mainnet smoke".
3. **No destructive Prisma operations against production.** Task 3 has a hard pause.
4. **No blind admin/migration endpoints.** A previous one (`619ccd7 chore: add one-off production payment migration endpoint` → `76d7c1c chore: remove one-off migration endpoint`) was already removed; do not add new ones unless protected, used briefly, then removed in the same task.
5. **Tasks 5 and 3 are HARD-PAUSED** until the user picks an option / confirms a fresh `pg_dump`. Do not run them on autopilot.
6. **Pause when uncertain.** If a step doesn't match what the playbook predicted, stop and ask. Do not retry, do not improvise mainnet.
7. **Next.js 16.2.4 caveat.** Per repo `AGENTS.md`, this Next.js version has breaking changes; consult `node_modules/next/dist/docs/` before touching framework behavior.

## Standing verification commands

After every task, before committing:

```bash
cd /root/veloran-astachain-clean   # or your local clone
npm run test:payment-safety
npm run lint
npx tsc --noEmit
git status --short --branch
git log --oneline -5
```

Never push a red build.

## Current state (verified from source, not assumed)

**Phase 4 code already shipped (local — must `git fetch` to see):**

- `lib/payment-memo.ts` — Memo program ix builder. `paymentMemoForIntent(nonce) → "veloran:intent:<nonce>"`.
- `lib/payment-intents.ts` — `createPaymentIntent(...)` / `getUsablePaymentIntent(...)`. 15-minute TTL. Returns 409 on consumed, 400 on expired/wrong-payer/wrong-resource.
- `lib/x402.ts:verifyOnChainPayment(...)` — now accepts an optional `expectedMemo`; if provided, checks `transactionContainsMemo(tx, expectedMemo)` first and rejects with 400 "Transaction memo does not match payment intent".
- `prisma/schema.prisma` — `PaymentIntent` (id, postId, resource, amountUsdc, creatorAddress, payerAddress?, nonce @unique, memo, expiresAt, consumedAt, createdAt) + `PaymentReceipt` (id, intentId, postId, readerAddress, amountUsdc, txSignature @unique, createdAt).
- `app/api/x402/[slug]/route.ts` — GET without header creates intent → 402 with `{ ..., intentId, memo, ... }`. GET with `X-PAYMENT` header looks up receipt by sig (409 if found), validates intent, calls `verifyOnChainPayment` with `expectedMemo: intent.memo`, creates `PaymentReceipt`, sets `consumedAt`.
- `app/api/payment-intents/[slug]/route.ts` — separate intent-creation endpoint (verify on first read; mirrors x402 GET-without-header).
- `app/api/unlock/[slug]/route.ts` — human path also intent-bound (verified by the smoke regex `expectedMemo: intent.memo`).
- `scripts/ai-reader.ts` — uses `buildMemoInstruction(reqs.extra.memo)`.
- `components/PaywallGate.tsx` — uses `buildMemoInstruction(intent.memo)`.
- `scripts/payment-safety-smoke.ts` — 46-line **regex-only** smoke. Asserts code shapes via string match. Does NOT actually run verification logic.

**Replay status:** consumed-intent rejection is enforced both by `PaymentReceipt.txSignature @unique` and by `PaymentIntent.consumedAt`. Status code on replay: **409**, body `{ error: "Payment signature already consumed" }` (in `/api/unlock`) or `{ error: "Payment intent already consumed" }` (in `/api/x402` and `lib/payment-intents.ts`).

**Stale replay copy still exists in:**
- `app/for-agents/page.tsx:204` — "The same `txSignature` is idempotent — replay it and you..."
- `app/demo/page.tsx:131` — "Idempotent verification: re-using the same..."

**Memo binding:** the memo is a **Memo program instruction** (program id `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`). `transactionContainsMemo` walks `tx.message.instructions` for that program ID.

**TTL:** 15 minutes per intent (`PAYMENT_INTENT_TTL_MS`).

---

## Task order (per brief recommendation)

| # | Task | Auto/Pause | Est. |
|---|---|---|---|
| 1 | Fix stale replay docs | Auto | 30 min |
| 2 | Fixture-based payment-verification tests | Auto | 2 hr |
| 4 | Network-aware boot + Solscan helper | Auto | 1.5 hr |
| 6 | Structured logs + `/api/health` + ops runbook | Auto | 1 hr |
| 5 | Subscription stance (A/B) | **PAUSE for user** | 30 min (A) / 1-2 days (B) |
| 3 | Prisma migration baseline | **PAUSE for user** | 1 hr |
| 7 | Human devnet verification | Manual | 30 min |
| 8 | Mainnet smoke checklist (author only) | Auto | 30 min |

Ordered by risk: docs/tests/config/logging are cheap and reduce blindness. DB baseline is the most dangerous, so it lands AFTER everything else is green.

---

## Task 1 — Fix stale replay docs

**Goal:** Public copy must match actual replay-protection behavior. Replace "idempotent / same signature returns content" with "consumed-intent rejection (409)".

**Files:**

- Modify: `app/for-agents/page.tsx`
- Modify: `app/demo/page.tsx`
- Modify: `README.md`
- Create: `docs/payment-safety.md`

**Steps:**

1. Sweep:
   ```bash
   rg -n 'idempotent|replay.*content|same txSignature|same signature' README.md app docs components scripts
   ```
   Confirm hits at the two known locations + any others.

2. **`app/for-agents/page.tsx`** — find the "Step 4 — A successful unlock" section (around line 204). Replace the idempotency paragraph:

   - Old: *"The same `txSignature` is idempotent — replay it and you get the same content back without paying twice."*
   - New: *"Replay rejected: re-sending the same `X-PAYMENT` (or any header pointing at a consumed intent) returns HTTP 409 with `{ error: \"Payment intent already consumed\" }`. Each `pay_for_content` transaction settles exactly one intent and may unlock the resource exactly once. To unlock again, request a fresh 402 challenge."*

3. **`app/demo/page.tsx`** — find the "What's happening on-chain" section (around line 131). Replace the "Idempotent verification" bullet:

   - Old: *"Idempotent verification: re-using the same `txSignature` returns the same content without double-charging."*
   - New: *"Single-use payments: each successful `pay_for_content` consumes exactly one `PaymentIntent`. Replay returns HTTP 409. Unique `PaymentReceipt.txSignature` adds a second guard at the database layer."*

4. **`README.md`** — add a short paragraph in the "How it works" section explaining the intent-bound flow:

   > Each paid request creates a server-bound `PaymentIntent` with a 15-minute TTL and a memo of the form `veloran:intent:<nonce>`. The buyer's transaction must include that memo as a Memo program instruction. The server consumes the intent on the first successful unlock; replays return 409.

5. **Create `docs/payment-safety.md`** — short doc covering current guarantees and limits:

   ```markdown
   # Payment Safety

   ## Guarantees

   - **Memo-bound payments.** Every paid request returns a 402 challenge with a server-issued `intentId` and `memo` (format: `veloran:intent:<nonce>`, 16 random hex bytes). The buyer's transaction MUST include that memo as a Memo program instruction (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`). Wrong memo = 400.
   - **Single-use.** Each `PaymentIntent` is consumed on the first successful unlock (`consumedAt` set). Replay returns 409.
   - **Unique signatures.** `PaymentReceipt.txSignature` has a unique constraint; same signature can never write a second receipt.
   - **TTL.** Intents expire after 15 minutes. Expired intent = 400.
   - **Payer binding.** Once an intent has a `payerAddress`, that's the only address that can settle it.
   - **On-chain split.** The Anchor program enforces 95/5 atomically; we verify recipient and platform deltas server-side after the tx confirms.

   ## Current limits (devnet)

   - USDC only. SOL/EURC are roadmap.
   - Per-call and subscription tiers. (Subscription replay safety: see Task 5 of Phase 4 plan.)
   - Mainnet remains gated until Phase 4 hardening passes.

   ## What replay actually returns

   - Same `intentId`, same `txSignature`: 409 with `{ error: "Payment signature already consumed" }` (human path) or `{ error: "Payment intent already consumed" }` (agent path).
   - Different `intentId` with stale memo: 400 "Transaction memo does not match payment intent".
   - Expired intent: 400 "Payment intent expired".
   ```

6. Verify no stale hits remain:
   ```bash
   rg -n 'idempotent|replay.*content|same txSignature' README.md app docs components scripts
   ```
   Expected: empty for the old phrasing. `docs/payment-safety.md` may legitimately mention the words; that's fine.

7. Standing verification + commit:
   ```bash
   npm run test:payment-safety
   npm run lint
   npx tsc --noEmit

   git add app/for-agents/page.tsx app/demo/page.tsx README.md docs/payment-safety.md
   git commit -m "docs: clarify payment replay protection"
   git push
   ```

---

## Task 2 — Fixture-based payment-verification tests

**Goal:** Replace the regex-only `scripts/payment-safety-smoke.ts` with real executable tests that drive `verifyOnChainPayment` through fixture transactions. Cover the 9 invariants the brief enumerates.

**Files:**

- Create: `scripts/payment-verification-tests.ts`
- Create: `tests/fixtures/*.json` (one per case)
- Modify: `package.json` — add `"test:payment-verification": "tsx scripts/payment-verification-tests.ts"`
- Keep: `scripts/payment-safety-smoke.ts` as-is (the regex check still adds quick value).

**Steps:**

1. Add npm script:
   ```bash
   # In package.json scripts:
   #   "test:payment-verification": "tsx scripts/payment-verification-tests.ts"
   #   "test": "npm run test:payment-safety && npm run test:payment-verification"
   ```

2. Capture one real successful devnet tx as the **happy** fixture. Pick a confirmed signature from a recent unlock (query `PaymentReceipt` table, or the prior agent test `kArurSL9Bz9QLQcCKvTiohQToEKHuddKtTfKPWkwyiGXZVR13jqHofctExEc7Bm8szeJzkrWskT8qEJTVq3v83o`):

   ```bash
   mkdir -p tests/fixtures

   # Use the ai-reader's connection or solana CLI:
   solana confirm --output json --url "$NEXT_PUBLIC_HELIUS_RPC_URL" \
     kArurSL9Bz9QLQcCKvTiohQToEKHuddKtTfKPWkwyiGXZVR13jqHofctExEc7Bm8szeJzkrWskT8qEJTVq3v83o \
     > tests/fixtures/happy.json
   ```

   Or write a one-off `scripts/capture-fixture.ts` that calls `connection.getParsedTransaction(sig, { maxSupportedTransactionVersion: 0 })` and dumps it. Whichever is easier; the goal is a `ParsedTransactionWithMeta` JSON.

3. Build derived fixtures by mutating one field per case. Save under `tests/fixtures/`:

   | Fixture | Mutation | Expected reason |
   |---|---|---|
   | `wrong-memo.json` | Change the Memo program ix data bytes | `"Transaction memo does not match payment intent"` |
   | `no-program.json` | Strip Veloran program ID from `accountKeys` and remove its CPIs | `"Transaction did not invoke the Veloran program"` |
   | `wrong-payer.json` | Change `expectedPayerAddress` (don't mutate fixture; pass a different arg) | `"Claimed payer's USDC account not in transaction"` or `"Claimed payer wallet did not fund this transfer"` |
   | `missing-recipient-ata.json` | Strip the creator ATA from `accountKeys` | `"Recipient USDC account not in transaction"` |
   | `missing-platform-ata.json` | Strip the treasury ATA from `accountKeys` | `"Platform USDC account not in transaction"` |
   | `insufficient-creator-delta.json` | Reduce `meta.postTokenBalances` for creator ATA so delta < 95% | `"Recipient received .* expected >= ..."` |
   | `insufficient-platform-delta.json` | Reduce `meta.postTokenBalances` for treasury ATA so delta < 5% | `"Platform received .* expected >= ..."` |
   | `failed-tx.json` | Set `meta.err` to non-null | `"Transaction failed on-chain"` |

   Two cases are NOT fixture-based (they're DB/route-level); cover them with stub Prisma calls inside the test:

   - `consumed-intent` — call `getUsablePaymentIntent({...})` against a pre-inserted intent with `consumedAt` set; expect `{ error: "Payment intent already consumed", status: 409 }`.
   - `expired-intent` — same shape, `expiresAt` in the past; expect `{ error: "Payment intent expired", status: 400 }`.

4. Author `scripts/payment-verification-tests.ts`:

   ```ts
   import { strict as assert } from "node:assert";
   import { readFileSync } from "node:fs";
   import { verifyOnChainPayment } from "../lib/x402";

   type Case = {
     name: string;
     fixture: string;
     args: {
       recipientAddress: string;
       amountUsdc: number;
       expectedPayerAddress: string;
       expectedMemo?: string;
     };
     expect: "ok" | "fail";
     expectedReasonRegex?: RegExp;
   };

   // Constants taken from the happy fixture so all cases share the same
   // recipient/payer/memo/amount unless a case explicitly overrides.
   const HAPPY = JSON.parse(readFileSync("tests/fixtures/happy.json", "utf8"));
   const HAPPY_RECIPIENT = "[creator address from happy fixture]";
   const HAPPY_PAYER     = "[payer address from happy fixture]";
   const HAPPY_MEMO      = "[veloran:intent:<nonce> from happy fixture]";
   const HAPPY_AMOUNT    = 500_000; // micro-USDC

   const cases: Case[] = [
     {
       name: "happy: correct memo + payer + deltas accepted",
       fixture: "happy.json",
       args: { recipientAddress: HAPPY_RECIPIENT, amountUsdc: HAPPY_AMOUNT, expectedPayerAddress: HAPPY_PAYER, expectedMemo: HAPPY_MEMO },
       expect: "ok",
     },
     {
       name: "wrong memo rejected",
       fixture: "wrong-memo.json",
       args: { recipientAddress: HAPPY_RECIPIENT, amountUsdc: HAPPY_AMOUNT, expectedPayerAddress: HAPPY_PAYER, expectedMemo: HAPPY_MEMO },
       expect: "fail",
       expectedReasonRegex: /memo does not match/i,
     },
     // ... one entry per row of the table above
   ];

   let pass = 0, fail = 0;
   for (const c of cases) {
     const tx = JSON.parse(readFileSync(`tests/fixtures/${c.fixture}`, "utf8"));
     const result = verifyOnChainPayment({ tx, ...c.args });
     const ok =
       c.expect === "ok"
         ? result.ok === true
         : result.ok === false && (!c.expectedReasonRegex || c.expectedReasonRegex.test(result.error));
     if (ok) {
       console.log(`✅ ${c.name}`);
       pass++;
     } else {
       console.error(`❌ ${c.name} — got ${JSON.stringify(result)}`);
       fail++;
     }
   }
   console.log(`\n${pass}/${cases.length} passed`);
   process.exit(fail === 0 ? 0 : 1);
   ```

5. Add the two DB-level cases as a separate block in the same script (or a sibling script `scripts/payment-intent-tests.ts`):

   ```ts
   import { prisma } from "../lib/db";
   import { getUsablePaymentIntent } from "../lib/payment-intents";

   // Use a test DB. If DATABASE_URL points at production, REFUSE to run.
   if (!process.env.DATABASE_URL?.includes("test") && !process.env.DATABASE_URL?.startsWith("file:")) {
     console.error("Refusing to run intent tests: set DATABASE_URL to a test DB or sqlite file");
     process.exit(1);
   }

   // 1. Insert a CONSUMED intent. Call getUsablePaymentIntent. Expect status 409.
   // 2. Insert an EXPIRED intent. Call getUsablePaymentIntent. Expect status 400.
   ```

6. Verify:
   ```bash
   npm run test:payment-verification
   # Expected: N/N passed, exit 0

   npm run test:payment-safety
   # Existing regex smoke still green

   npm run lint
   npx tsc --noEmit
   ```

7. Commit:
   ```bash
   git add tests/fixtures scripts/payment-verification-tests.ts package.json
   git commit -m "test: cover payment verification invariants"
   git push
   ```

---

## Task 4 — Network-aware boot + Solscan helper

**Goal:** Make it impossible to boot mainnet with devnet constants. Centralize Solscan link generation.

**Files:**

- Modify: `lib/solana.ts` — read network from env, select per-network constants, throw on mismatch.
- Create: `lib/network.ts` — `solscanTxUrl`, `solscanAccountUrl`, `currentNetwork`, `isMainnet`.
- Modify: every file with hardcoded `?cluster=devnet` Solscan URLs.
- Modify: every file with hardcoded mint / program ID / treasury addresses outside `lib/solana.ts`.
- Modify: `scripts/payment-safety-smoke.ts` — add a config-mismatch assertion if straightforward.

**Required env vars (per brief Section F):**

- `NEXT_PUBLIC_SOLANA_NETWORK` — `devnet` | `mainnet-beta`
- `NEXT_PUBLIC_USDC_MINT` — `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (devnet) | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (mainnet)
- `NEXT_PUBLIC_VELORAN_PROGRAM_ID` — devnet `2CtnLfde…` | mainnet program ID
- `NEXT_PUBLIC_VELORAN_TREASURY` — devnet treasury | mainnet treasury
- `SERVER_SOLANA_RPC_URL` — private mainnet RPC (server-only; never `NEXT_PUBLIC_*`)

**Steps:**

1. Update `lib/solana.ts` to read all 4 public env vars, plus `SERVER_SOLANA_RPC_URL` with fallback to `NEXT_PUBLIC_HELIUS_RPC_URL`. At module load:

   - If `NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"`:
     - Reject if `NEXT_PUBLIC_USDC_MINT` matches the devnet USDC mint.
     - Reject if `NEXT_PUBLIC_VELORAN_PROGRAM_ID` matches the devnet program ID.
     - Reject if `NEXT_PUBLIC_VELORAN_TREASURY` matches the devnet treasury.
     - Reject if `SERVER_SOLANA_RPC_URL` is unset OR contains "devnet".
     - Throw a clear error: `"Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but <which var> still points at devnet."`

   Keep backwards-compat exports: `USDC_MINT`, `VELORAN_PROGRAM_ID`, `VELORAN_TREASURY` — derived from the env-driven values.

2. Create `lib/network.ts`:

   ```ts
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
   ```

3. Replace hardcoded Solscan URLs:

   ```bash
   rg -n 'solscan\.io.*cluster=devnet|solscan\.io/(tx|account)/' app components lib scripts
   ```

   For every hit, import `solscanTxUrl` / `solscanAccountUrl` from `@/lib/network` and replace.

4. Replace hardcoded mint/program/treasury addresses outside `lib/solana.ts`:

   ```bash
   rg -n '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU|EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v|2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS|DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP' \
     app components lib scripts | rg -v '^lib/solana\.ts:'
   ```

   For every hit, import from `@/lib/solana` instead.

5. Local boot test with mismatched env (NO real env values needed):

   ```bash
   # Devnet env, devnet constants — should boot
   NEXT_PUBLIC_SOLANA_NETWORK=devnet \
   NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
   NEXT_PUBLIC_VELORAN_PROGRAM_ID=2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS \
   NEXT_PUBLIC_VELORAN_TREASURY=DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP \
   npx tsc --noEmit
   # Expected: clean

   # Mainnet env but devnet USDC — should refuse to boot
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta \
   NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
   SERVER_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com \
   timeout 5 npm run dev 2>&1 | head -20
   # Expected: server crashes with "Refusing to boot: ..."
   ```

6. Add a config-mismatch assertion to the existing `scripts/payment-safety-smoke.ts` (optional but cheap):

   ```ts
   // Append after existing asserts:
   if (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta") {
     assert.notEqual(
       process.env.NEXT_PUBLIC_USDC_MINT,
       "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
       "config: mainnet env must not use devnet USDC mint"
     );
   }
   ```

7. Verify + commit:
   ```bash
   npm run test:payment-safety
   npm run lint
   npx tsc --noEmit

   git add lib/solana.ts lib/network.ts app components scripts
   git commit -m "chore: harden Solana network configuration"
   git push
   ```

---

## Task 6 — Structured logs + `/api/health` + ops runbook

**Goal:** Make payment failures diagnosable from Vercel logs without leaking secrets. Add a coarse health endpoint.

**Files:**

- Create: `lib/log.ts`
- Modify: `app/api/x402/[slug]/route.ts`
- Modify: `app/api/unlock/[slug]/route.ts`
- Modify: `app/api/payment-intents/[slug]/route.ts`
- Create: `app/api/health/route.ts`
- Create: `docs/ops-runbook.md`

**Steps:**

1. Create `lib/log.ts` with allowlist-based event logger:

   ```ts
   const ALLOWED_KEYS = new Set([
     "event",
     "intentId",          // OK — intent IDs are not secrets
     "slug",              // OK — slugs are public
     "network",
     "expectedAmount",
     "signaturePrefix6",  // 6-char prefix only; full sig also fine, but be consistent
     "errorCode",
     "reason",
     "creatorDeltaMicro",
     "platformDeltaMicro",
     "ts",
   ]);

   export function event(name: string, payload: Record<string, unknown>): void {
     const safe: Record<string, unknown> = { event: name, ts: new Date().toISOString() };
     for (const [k, v] of Object.entries(payload)) {
       if (ALLOWED_KEYS.has(k) && v !== undefined && v !== null) {
         safe[k] = v;
       }
     }
     // Use console.info so Vercel collects without surfacing as warnings
     console.info(JSON.stringify(safe));
   }

   export function sigPrefix6(sig: string): string {
     return sig.slice(0, 6);
   }
   ```

2. Wire 5 events into the routes:

   - **`payment_challenge_created`** — at intent creation. Fields: `intentId`, `slug`, `network`, `expectedAmount`. Emit from `app/api/x402/[slug]/route.ts` (no-payment-header branch) and `app/api/payment-intents/[slug]/route.ts`.
   - **`payment_tx_lookup_failed`** — when `connection.getParsedTransaction` returns null. Fields: `intentId`, `signaturePrefix6`, `network`, `errorCode: "tx_not_found"`. Emit from x402 + unlock routes.
   - **`payment_verification_failed`** — when `verifyOnChainPayment` returns `ok: false`. Fields: `intentId`, `reason` (from `result.error`). Emit from x402 + unlock routes.
   - **`payment_accepted`** — on successful unlock (just before/after `paymentReceipt.create`). Fields: `intentId`, `signaturePrefix6`, `network`, `creatorDeltaMicro`, `platformDeltaMicro`.
   - **`payment_replay_rejected`** — when `existingReceipt` is found OR intent.consumedAt is set. Fields: `intentId`, `signaturePrefix6`, `network`.

   **Never** pass `req.body`, headers, environment variables, or full DB rows into `event()`. The allowlist filters them out anyway, but don't pass them in the first place.

3. Create `app/api/health/route.ts`:

   ```ts
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
   ```

   No env dump, no version, no commit hash. Coarse only.

4. Create `docs/ops-runbook.md`:

   ```markdown
   # Ops Runbook

   ## Health check
   curl -s https://veloran-paywall-sage.vercel.app/api/health | jq
   # Expected: { "app": "ok", "db": "ok", "rpc": "ok", "network": "devnet" }

   ## Payment event log queries
   vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 30m --json | \
     jq -c 'select(.message | test("\"event\":")) | (.message | fromjson)'

   ## By event type
   for ev in payment_challenge_created payment_tx_lookup_failed payment_verification_failed payment_accepted payment_replay_rejected; do
     echo "=== $ev ==="
     vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 1h --json | \
       jq -c --arg ev "$ev" 'select(.message | test("\"event\":\"" + $ev + "\""))' | head -5
   done

   ## Incident checklist
   1. **Pause payments** by setting `NEXT_PUBLIC_VELORAN_TREASURY` to a non-existent address (forces 402 challenge to fail; sellers don't take funds).
   2. **Roll back deploy** via Vercel dashboard → Deployments → previous → Promote.
   3. **Inspect logs** via the queries above.
   4. **Verify DB** with `npx prisma migrate status` (see Task 3).
   5. **Preserve evidence** — for any tx-related incident, capture the signature, intent ID, and Solscan link before doing anything else.
   ```

5. Verify locally:
   ```bash
   curl -s http://localhost:3000/api/health | jq
   # Expected: all "ok" if dev DB + RPC are reachable

   # After running an agent E2E, check logs:
   vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 5m --json --limit 100 | \
     jq -c 'select(.message | test("\"event\":"))'
   ```

6. Commit:
   ```bash
   git add lib/log.ts app/api docs/ops-runbook.md
   git commit -m "chore: add payment observability and ops runbook"
   git push
   ```

---

## ⏸ PAUSE before Task 5

After Tasks 1, 2, 4, 6 are committed + green, post in chat:

> Tasks 1, 2, 4, 6 done and green. Ready for Task 5 (subscription stance). Recommended: **Option A (disable subscriptions on mainnet)** for first smoke. Confirm "go A" or "go B".

Wait for the user. Do not autopilot.

---

## Task 5 — Subscription stance

**Trigger:** user replies "go A" or "go B".

### Task 5 — Option A — disable subscriptions on mainnet (RECOMMENDED, ~30 min)

**Files:**
- Modify: `app/api/subscriptions/[creatorId]/route.ts`
- Modify: `components/SubscribeButton.tsx`
- Modify: `app/c/[address]/page.tsx`
- Modify: `docs/pitch-deck.md` slide 7 footnote

**Steps:**

1. Top of `app/api/subscriptions/[creatorId]/route.ts` POST handler:

   ```ts
   import { isMainnet } from "@/lib/network";

   export async function POST(req: NextRequest, { params }: Params) {
     if (isMainnet()) {
       return NextResponse.json(
         { error: "subscriptions are devnet-only during Phase 4; per-call payments only on mainnet" },
         { status: 503 }
       );
     }
     // ... existing handler unchanged
   }
   ```

2. `components/SubscribeButton.tsx` — early return on mainnet:

   ```tsx
   import { isMainnet } from "@/lib/network";

   // inside component, before existing button render:
   if (isMainnet()) {
     return (
       <button
         disabled
         className="opacity-50 cursor-not-allowed px-5 py-3 rounded-lg border border-neutral-800 text-neutral-400 text-sm"
         title="Subscriptions launch in Phase 5. Use per-call payments."
       >
         Subscriptions on devnet only
       </button>
     );
   }
   ```

3. `app/c/[address]/page.tsx` — wrap the Subscribe section with the same gate, replacing the buttons with a "Per-call only on mainnet" notice that links to the per-call posts.

4. Add a footnote to `docs/pitch-deck.md` slide 7: "subscriptions launch in Phase 5; mainnet is per-call only on day one."

5. Verify + commit:
   ```bash
   # Devnet env: subscription flow still works end-to-end
   # Mainnet env: subscribe button disabled, route returns 503

   npm run test:payment-safety
   npm run lint
   npx tsc --noEmit

   git add app components docs
   git commit -m "chore: disable subscriptions for mainnet until hardened"
   git push
   ```

### Task 5 — Option B — harden subscriptions to intent-bound (NOT recommended for hackathon timeline)

If user picks B, this is **1-2 days** of work that will likely overrun the May 10 deadline. Confirm with user before starting. File scope:

- `prisma/schema.prisma` — extend `PaymentIntent` with optional `subscriberCreatorId`, `plan` ("monthly" | "yearly"), `creatorId` for subscription lookups; OR create a sibling `SubscriptionPaymentIntent` model.
- `lib/payment-intents.ts` — add `createSubscriptionIntent()` and `getUsableSubscriptionIntent()`.
- `app/api/subscriptions/[creatorId]/route.ts` — POST creates intent on first call (returns 402), validates on second call.
- `components/SubscribeButton.tsx` — fetch intent first, embed memo, then sign.
- `lib/x402.ts` — verify the existing `verifyOnChainPayment` is reusable for subscriptions (different recipient, but same shape).
- Tests in `scripts/payment-verification-tests.ts` extended for subscription cases.

If Option B is selected, escalate to user that hackathon timeline slips. Otherwise default to A.

---

## ⏸ PAUSE before Task 3

After Task 5 lands, post in chat:

> Task 5 done. Task 3 (Prisma migration baseline) is the most dangerous of Phase 4 — needs:
> 1. Fresh `pg_dump` of production schema + data
> 2. Coordinated 5-minute deploy freeze
> 3. Explicit "go 3" approval
>
> Confirm all three when ready.

Wait. Do not run Task 3 on autopilot.

---

## Task 3 — Prisma migration baseline

**Trigger:** user replied "go 3" + confirmed pg_dump.

**Goal:** Establish a real Prisma migration history. Production currently has `PaymentIntent` and `PaymentReceipt` tables applied via the now-removed one-off migration endpoint (`af179ee`/`619ccd7`/`76d7c1c`); they exist in the DB but no committed migration created them.

**Files:**
- Create: `prisma/migrations/000001_baseline/migration.sql`
- Create: `prisma/migrations/migration_lock.toml` (if missing)
- Create: `scripts/check-prisma-drift.sh`
- Create: `docs/db-operations.md`

**Steps:**

1. Take fresh backups (do NOT commit):

   ```bash
   mkdir -p backups
   pg_dump --schema-only "[REDACTED-DATABASE-URL]" > backups/prod-schema-$(date +%F).sql
   pg_dump            "[REDACTED-DATABASE-URL]" > backups/prod-full-$(date +%F).sql

   # Inspect — should list Creator, Post, Unlock, SubscriptionTier, Subscription,
   # PaymentIntent, PaymentReceipt + (possibly) _prisma_migrations
   grep '^CREATE TABLE' backups/prod-schema-$(date +%F).sql

   # Add backup files to .gitignore if not already
   echo "backups/" >> .gitignore
   ```

2. Drift check — compare `prisma/schema.prisma` against the production DB:

   ```bash
   npx prisma migrate diff \
     --from-url "[REDACTED-DATABASE-URL]" \
     --to-schema-datamodel prisma/schema.prisma \
     --script > /tmp/drift.sql

   wc -l /tmp/drift.sql
   ```

   **Decision point:**
   - 0 lines or "-- This is an empty migration." → schema and prod are in sync; proceed.
   - Non-empty → STOP. Read `/tmp/drift.sql`. The schema file or production must change first; baseline must reflect production reality. Escalate to user.

3. Generate the baseline migration:

   ```bash
   mkdir -p prisma/migrations/000001_baseline

   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/000001_baseline/migration.sql

   # Should be a non-empty SQL file with CREATE TABLE statements
   wc -l prisma/migrations/000001_baseline/migration.sql
   head -30 prisma/migrations/000001_baseline/migration.sql
   ```

4. If `prisma/migrations/migration_lock.toml` doesn't exist:

   ```bash
   cat > prisma/migrations/migration_lock.toml <<EOF
   provider = "postgresql"
   EOF
   ```

5. Mark baseline as applied (writes to `_prisma_migrations` table without re-running SQL):

   ```bash
   DATABASE_URL="[REDACTED-DATABASE-URL]" npx prisma migrate resolve --applied 000001_baseline
   ```

6. Verify status is clean:

   ```bash
   DATABASE_URL="[REDACTED-DATABASE-URL]" npx prisma migrate status
   # Expected: "Database schema is up to date!"
   ```

7. Create `scripts/check-prisma-drift.sh`:

   ```bash
   #!/usr/bin/env bash
   set -e
   if [ -z "$DATABASE_URL" ]; then
     echo "Set DATABASE_URL before running"
     exit 1
   fi
   npx prisma migrate diff \
     --from-url "$DATABASE_URL" \
     --to-schema-datamodel prisma/schema.prisma \
     --script
   ```

   ```bash
   chmod +x scripts/check-prisma-drift.sh
   ```

8. Create `docs/db-operations.md`:

   ```markdown
   # Database Operations

   ## Backups (NEVER commit these)
   pg_dump --schema-only "$DATABASE_URL" > backups/prod-schema-$(date +%F).sql
   pg_dump            "$DATABASE_URL" > backups/prod-full-$(date +%F).sql

   ## Drift check
   DATABASE_URL=... ./scripts/check-prisma-drift.sh

   ## Migration status
   DATABASE_URL=... npx prisma migrate status

   ## Apply pending migrations (Vercel does this on build)
   DATABASE_URL=... npx prisma migrate deploy

   ## Restore from backup (in disaster)
   psql "$DATABASE_URL" < backups/prod-full-YYYY-MM-DD.sql
   ```

9. Commit (do NOT include backups/):

   ```bash
   git add prisma/migrations scripts/check-prisma-drift.sh docs/db-operations.md .gitignore
   git commit -m "chore: baseline production database migrations"
   git push
   ```

10. After Vercel redeploys, verify:

    ```bash
    DATABASE_URL="[REDACTED-DATABASE-URL]" npx prisma migrate status
    # Still expected: "Database schema is up to date!"
    ```

---

## Task 7 — Human browser devnet verification

**Goal:** Confirm the patched `PaywallGate` works end-to-end in a real browser (the agent path was already verified pre-`9627a18`; the human path needs the same confidence post-memo-fix).

**Steps:**

1. Open `https://veloran-paywall-sage.vercel.app/` in fresh incognito.
2. Sign in via Privy (email path).
3. Create a test post specifically for this verification:
   - Slug: `phase4-human-verify-2026-05-09`
   - Price: $0.10
   - Content: any short text or JSON
4. Sign out. Open the post URL in another fresh incognito. Sign in as a different reader.
5. Click Unlock. Verify in order:
   - Privy modal opens with the SPL transferChecked + memo ix
   - Tx confirms within ~5 seconds
   - Content reveals
   - Solscan link in the unlocked card uses the network-aware helper (no `?cluster=devnet` if Task 4 changed it for devnet — actually devnet links still want it; verify the helper output)
6. Capture the X-PAYMENT header from the request (instrument `PaywallGate` to log it temporarily, or read from Vercel logs).
7. Replay test:
   ```bash
   PAYLOAD="<base64url X-PAYMENT>"
   curl -i -H "X-PAYMENT: $PAYLOAD" \
     https://veloran-paywall-sage.vercel.app/api/x402/phase4-human-verify-2026-05-09
   # Expected: HTTP/1.1 409 with body { "error": "Payment intent already consumed" }
   #           (or "Payment signature already consumed" for unlock route)
   ```
8. Run agent E2E against the same slug:
   ```bash
   set -a; . ./.env.local; set +a
   VELORAN_BASE_URL=https://veloran-paywall-sage.vercel.app \
   AGENT_KEYPAIR_PATH=/root/.config/solana/agent.json \
   NEXT_PUBLIC_SOLANA_RPC_URL="$NEXT_PUBLIC_HELIUS_RPC_URL" \
   npm run ai-reader -- phase4-human-verify-2026-05-09
   ```
9. Check `/api/health`:
   ```bash
   curl -s https://veloran-paywall-sage.vercel.app/api/health | jq
   ```
10. Document everything in `docs/runs/2026-05-09-phase4-devnet-verification.md`:
    - Test post slug, price, tx signatures (full)
    - Replay 409 response body (paste verbatim)
    - Agent E2E success (output snippet)
    - Health endpoint output
    - Sample of structured logs from Vercel showing the 5 event types

11. Commit:
    ```bash
    git add docs/runs
    git commit -m "docs: phase 4 devnet end-to-end verification"
    git push
    ```

---

## Task 8 — Mainnet smoke checklist (author only, do NOT execute)

**Goal:** Author the runbook for the eventual first mainnet payment. Do NOT execute it.

**Files:**
- Create: `docs/mainnet-smoke-checklist.md`

**Steps:**

1. Author `docs/mainnet-smoke-checklist.md`:

   ```markdown
   # Mainnet Smoke Checklist (DO NOT RUN UNTIL EXPLICITLY APPROVED)

   ## Pre-conditions (all must be ✅)
   - [ ] Tasks 1, 2, 4, 6, 5, 3, 7 of Phase 4 complete and merged to main
   - [ ] Anchor program deployed to mainnet — confirm program ID on Solscan
   - [ ] All mainnet env vars set in a separate Vercel preview env (NOT main production):
     - NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
     - NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
     - NEXT_PUBLIC_VELORAN_PROGRAM_ID=<mainnet program id>
     - NEXT_PUBLIC_VELORAN_TREASURY=<mainnet treasury>
     - SERVER_SOLANA_RPC_URL=<private mainnet RPC>
     - DATABASE_URL=<separate mainnet DB or guarded reuse>
   - [ ] Mainnet treasury USDC ATA exists and is owned by the treasury address (verify with `spl-token account-info`)
   - [ ] `npm run test:payment-safety` and `npm run test:payment-verification` are green
   - [ ] Demo video and pitch deck are already submitted to the hackathon portal (smoke does not gate submission)
   - [ ] Subscription routes return 503 on the mainnet env (Option A in Task 5)

   ## Wallets
   - **Buyer:** fresh Solana wallet, never used. Funded with ≥ 0.01 SOL + 0.20 USDC.
   - **Creator:** existing or fresh; receives 95%.
   - **Treasury:** mainnet treasury address from env.

   ## Smoke value cap
   - First call MUST be ≤ **$0.10 USDC** (`100000` micro-USDC).
   - Self-loop allowed (buyer = creator = treasury) for absolute minimum risk; otherwise three distinct wallets.

   ## Procedure
   1. Create a self-loop test post on the mainnet preview env, slug `mainnet-smoke-2026-05-09`, price $0.10.
   2. Run agent E2E against the mainnet preview URL.
   3. Verify 402 challenge contains mainnet program ID, mainnet USDC mint, mainnet treasury.
   4. After payment, verify on-chain split on Solscan (no `?cluster=` flag).
   5. Replay the same X-PAYMENT — must return 409.
   6. Capture: tx signature, Solscan link, intent.id, full payment_accepted log event.

   ## Abort criteria (any one → STOP, roll back)
   - 402 challenge has wrong USDC mint or program ID
   - Tx confirms but verification fails server-side (funds moved, no Unlock created → manual reconciliation)
   - Any RPC or Privy error not seen on devnet
   - Subscription route returns 200 anywhere on mainnet (must be 503)
   - `/api/health` returns `network: "devnet"` despite mainnet env

   ## Rollback
   - There is no on-chain rollback for a confirmed split. If funds moved incorrectly, accept the loss and document.
   - For the deployment: revert Vercel preview env back to devnet vars; redeploy.

   ## Recovery
   - If anything unexpected: STOP. Page the user. Do not retry.

   ## After successful smoke
   - Document in `docs/runs/`.
   - Decide whether to raise the price cap or open mainnet to public sellers (NOT a Phase 4 decision).
   ```

2. Commit:
   ```bash
   git add docs/mainnet-smoke-checklist.md
   git commit -m "docs: add mainnet smoke checklist"
   git push
   ```

3. **DO NOT** execute the smoke. The user explicitly approves it in a separate decision.

---

## Final state after Phase 4

When all 8 tasks are committed + pushed, you should have:

- 8 Phase 4 commits in `git log` (10 if you count Task 0-style verification + the smoke checklist)
- `npm run test:payment-safety && npm run test:payment-verification` returning green
- `curl /api/health` returning `{ "app": "ok", "db": "ok", "rpc": "ok", "network": "devnet" }`
- `vercel logs --json` showing the 5 named event types in production
- Devnet verification run documented in `docs/runs/2026-05-09-phase4-devnet-verification.md`
- Mainnet smoke runbook authored at `docs/mainnet-smoke-checklist.md` but NOT executed
- No stale "idempotent replay" copy anywhere
- Subscription routes 503 on mainnet, 200 on devnet
- `_prisma_migrations` baseline applied; no temporary admin endpoints
- Zero secrets in any commit, log line, or chat message

Then post in chat:

> Phase 4 complete.
> - Verification: docs/runs/2026-05-09-phase4-devnet-verification.md
> - Mainnet runbook: docs/mainnet-smoke-checklist.md
> Awaiting explicit "go mainnet smoke" before any real-money execution.

Do not run the mainnet smoke without that approval.

---

## When to stop and ask

Pause and post in chat (do not improvise) whenever:

- A standing verification command fails (`tsc`, `lint`, `test:payment-safety`)
- Drift is detected in Task 3 step 2
- Task 4 boot test does NOT crash on mismatched config (security regression)
- A test fails for a reason other than the one declared
- The temporary admin endpoint pattern resurfaces in `app/api`
- The user has been silent for ≥ 30 min during a PAUSE
- A Solana tx confirms but server-side verification fails (potential real-loss path on mainnet — document tx sig immediately)

Pausing is always cheaper than recovering from a wrong move.

---

## What this playbook does NOT do

- Does NOT activate mainnet
- Does NOT migrate subscriptions to intent-bound (Phase 5)
- Does NOT add new product features
- Does NOT change the Anchor program
- Does NOT recover funds from a mistaken on-chain transfer
- Does NOT push to GitHub before standing verification commands pass
- Does NOT touch Vercel env vars on autopilot — env changes are user-driven
- Does NOT commit `backups/` or any `pg_dump` output

If a task tempts you outside these boundaries, stop and ask.
