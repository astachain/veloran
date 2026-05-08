# Veloran Phase 4 Hardening Implementation Plan

> **For Hermes / external coders:** Use GitHub as the source of truth. Assume the coder may not have VPS access. Clone `https://github.com/astachain/veloran`, work from branch `main`, and confirm the current commit before planning or coding. Do not jump straight to mainnet. Mainnet without audit-grade payment safety is a footgun with branding.

**Goal:** Move Veloran from proven devnet payment demo to mainnet-ready production candidate with migration baseline, stronger payment verification, monitoring, tests, and a tiny-value mainnet smoke path.

**Architecture:** Keep production on devnet until the hardening gates pass. Harden the existing Next.js 16 + Prisma + Solana flow in layers: database baseline first, payment invariants second, observability third, then mainnet config and smoke test last. Each task should be small, tested, committed, and deployed only after local checks pass.

**Tech Stack:** Next.js 16.2.4, React 19, Prisma 6.19.3, Postgres/Neon, Vercel, Solana web3.js, SPL Token, custom Anchor program, Privy, TypeScript.

---

## Current Evidence / Baseline

- GitHub repo: `https://github.com/astachain/veloran`
- Clone command for external coders: `git clone https://github.com/astachain/veloran.git`
- VPS repo path, if available: `/root/veloran-astachain-clean`
- Branch: `main`, tracking `origin/main`
- Latest pushed commit before this plan was externalized: `9627a18 fix: use server payment memo for intent-bound payments`
- Production alias: `https://veloran-paywall-sage.vercel.app`
- Latest fixed deploy inspected earlier: production ready, x402 returns 402.
- Devnet agent test passed:
  - Agent paid on-chain.
  - Server returned gated content.
  - Replayed `X-PAYMENT` rejected with `409 Payment intent already consumed`.
- Production DB has `PaymentIntent` and `PaymentReceipt` tables, but migration baseline is not yet proper Prisma history.
- Known stale docs/UI issue from code search:
  - `app/for-agents/page.tsx` still says replay is idempotent / returns same content. That is now wrong; replay should reject.
  - `app/demo/page.tsx` appears to mention idempotent replay too. Also wrong.

---

## Non-Negotiable Gates Before Mainnet

1. **Database gate:** Prisma migration history exists and matches production schema.
2. **Payment safety gate:** Automated tests cover intent/memo/resource/payer/signature replay invariants.
3. **Subscription gate:** Subscription payment flow gets the same intent-bound replay protection as per-post unlocks, or is explicitly disabled on mainnet.
4. **Observability gate:** Production errors and payment failures are visible without leaving a fragile terminal watcher running forever.
5. **Config gate:** Mainnet requires explicit env; no devnet fallbacks can silently run against mainnet.
6. **Operational gate:** Backups, rollback, and incident checklist exist.
7. **Tiny-value gate:** First mainnet test uses a deliberately tiny amount and fresh wallets only.

---

## Phase 4 Checklist Overview

### A. Documentation and stale claims

- [ ] Fix `/for-agents` copy: replay is rejected, not idempotently content-returning.
- [ ] Fix `/demo` copy if it repeats old replay behavior.
- [ ] Update README agent flow to mention intent-bound memo and replay rejection.
- [ ] Add a short `docs/payment-safety.md` explaining current guarantees and limits.

### B. Database migration baseline

- [ ] Inspect current production schema safely.
- [ ] Create Prisma migration baseline without destructive changes.
- [ ] Add schema drift check script.
- [ ] Document DB backup/restore commands without committing dumps.
- [ ] Verify `npx prisma migrate status` becomes meaningful for future deploys.

### C. Payment verification hardening

- [ ] Add real unit/integration tests for x402 helpers beyond smoke regex checks.
- [ ] Assert memo verification supports parsed memo shape from real Solana transactions.
- [ ] Assert wrong memo fails.
- [ ] Assert wrong payer fails.
- [ ] Assert wrong recipient/platform ATA fails.
- [ ] Assert insufficient creator/platform deltas fail.
- [ ] Assert duplicate tx signature fails.
- [ ] Assert consumed intent fails.
- [ ] Assert expired intent fails.

### D. Human paywall hardening

- [ ] Run browser/manual Privy flow on devnet after memo fix.
- [ ] Confirm human unlock records `PaymentReceipt`, `Unlock`, and consumes intent.
- [ ] Confirm human replay rejects or stays safely locked without leaking content.
- [ ] Improve client error copy for memo mismatch / consumed intent / insufficient funds.

### E. Subscription flow decision

- [ ] Audit `components/SubscribeButton.tsx` and `app/api/subscriptions/[creatorId]/route.ts`.
- [ ] Decide: either add `PaymentIntent`-style nonce/memo/receipt flow for subscriptions, or disable subscriptions for mainnet launch.
- [ ] If keeping subscriptions, add `SubscriptionPaymentIntent` or reuse `PaymentIntent` with `resource` type.
- [ ] Add replay tests for subscription signatures.

### F. Mainnet config hardening

- [ ] Make mainnet mode require all of:
  - `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
  - `NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
  - `NEXT_PUBLIC_VELORAN_PROGRAM_ID=<mainnet deployed program>`
  - `NEXT_PUBLIC_VELORAN_TREASURY=<mainnet treasury public key>`
  - `SERVER_SOLANA_RPC_URL=<private mainnet RPC>`
- [ ] Add startup assertion that devnet program/mint/treasury cannot be mixed into mainnet.
- [ ] Add visible environment banner in dashboard/admin-ish areas.
- [ ] Ensure Solscan cluster links are network-aware, not hardcoded `cluster=devnet`.

### G. Observability and operational safety

- [ ] Add structured payment logs with no secrets:
  - challenge created
  - tx lookup failed
  - verification failed reason
  - payment accepted
  - replay rejected
- [ ] Add a lightweight health endpoint that checks DB and Solana RPC reachability without leaking config.
- [ ] Add Vercel log query snippets to docs.
- [ ] Add optional scheduled monitor for live 402 challenge health only; no noisy forever watcher.
- [ ] Add incident checklist: pause mainnet, rollback deploy, inspect logs, verify DB, preserve tx signature.

### H. Tiny-value mainnet smoke plan

- [ ] Deploy Anchor program to mainnet or confirm deployed program ID.
- [ ] Use fresh buyer wallet with tiny SOL and tiny USDC.
- [ ] Use a tiny post price for smoke test.
- [ ] Run one live unlock.
- [ ] Replay the same payment header and expect rejection.
- [ ] Verify creator/platform splits on Solscan.
- [ ] Only then raise price / open public mainnet.

---

## Task-by-Task Plan

### Task 1: Fix stale replay documentation

**Objective:** Make public docs match actual replay-protection behavior.

**Files:**
- Modify: `app/for-agents/page.tsx`
- Modify: `app/demo/page.tsx`
- Modify: `README.md`
- Possibly create: `docs/payment-safety.md`

**Steps:**
1. Search for stale replay/idempotent language.
2. Replace claims that replay returns content with claims that replay is rejected as consumed.
3. Add a short note: valid flow is `402 -> pay with server memo -> re-request once -> content`; same signature later returns `409`.
4. Run:
   ```bash
   npm run lint && npx tsc --noEmit
   ```
5. Commit:
   ```bash
   git add app/for-agents/page.tsx app/demo/page.tsx README.md docs/payment-safety.md
   git commit -m "docs: clarify payment replay protection"
   ```

**Verification:** Public pages no longer promise idempotent replay; local lint/typecheck pass.

---

### Task 2: Add focused payment safety tests

**Objective:** Replace regex-only smoke confidence with actual executable tests around payment helper behavior.

**Files:**
- Create: `scripts/payment-verification-tests.ts`
- Modify: `package.json`
- Keep: `scripts/payment-safety-smoke.ts` as quick static guard, or merge later.

**Steps:**
1. Add script:
   ```json
   "test:payment-verification": "tsx scripts/payment-verification-tests.ts"
   ```
2. Build fixture objects for parsed transactions with controlled `accountKeys`, `preTokenBalances`, `postTokenBalances`, memo instructions, and program invocation.
3. Test passing case.
4. Test wrong memo.
5. Test missing Veloran program.
6. Test missing recipient/platform/payer ATA.
7. Test insufficient deltas.
8. Run:
   ```bash
   npm run test:payment-safety
   npm run test:payment-verification
   npm run lint
   npx tsc --noEmit
   ```
9. Commit:
   ```bash
   git add package.json scripts/payment-verification-tests.ts scripts/payment-safety-smoke.ts
   git commit -m "test: cover payment verification invariants"
   ```

**Verification:** Helper-level failure modes are deterministic without needing Solana RPC.

---

### Task 3: Create production schema baseline plan and drift check

**Objective:** Stop relying on manual one-off SQL as the long-term DB story.

**Files:**
- Create: `prisma/migrations/000001_baseline/migration.sql`
- Create: `scripts/check-prisma-drift.sh`
- Create/modify: `docs/db-operations.md`

**Steps:**
1. Inspect current schema using Prisma and/or `pg_dump --schema-only` only if production DB access works from VPS.
2. If direct DB access is still blocked, use a Vercel-executed read-only route/job only after explicit approval, protected and removed immediately after use. Prefer direct DB if possible.
3. Create a baseline migration matching current schema.
4. Mark baseline as applied in production using Prisma’s recommended baseline workflow. Do **not** run destructive `migrate deploy` blindly.
5. Add `scripts/check-prisma-drift.sh` for future manual use.
6. Run local checks.
7. Commit:
   ```bash
   git add prisma/migrations scripts/check-prisma-drift.sh docs/db-operations.md
   git commit -m "chore: baseline production database migrations"
   ```

**Verification:** Future migrations become Prisma-managed; no missing-table surprise on deploy.

**Risk:** This is the most dangerous Phase 4 item. Do not execute without a DB backup and exact confirmation of target DB.

---

### Task 4: Harden mainnet/devnet configuration

**Objective:** Prevent accidental mainnet/devnet mixing.

**Files:**
- Modify: `lib/solana.ts`
- Modify: UI files with Solscan links:
  - `components/PaywallGate.tsx`
  - `components/DashboardClient.tsx`
  - `components/SubscribeButton.tsx`
  - `app/c/[address]/page.tsx`
- Add tests/smoke assertions in `scripts/payment-safety-smoke.ts` or new config test.

**Steps:**
1. Add helper for Solscan cluster suffix based on `SOLANA_NETWORK`.
2. Replace hardcoded `?cluster=devnet` with helper.
3. Add explicit mainnet config assertions: no devnet USDC mint, no devnet program, no devnet treasury in mainnet mode.
4. Add tests for config mismatch throwing.
5. Run local checks.
6. Commit:
   ```bash
   git add lib/solana.ts components app scripts
   git commit -m "chore: harden Solana network configuration"
   ```

**Verification:** Mainnet cannot boot with devnet constants; links are network-aware.

---

### Task 5: Audit subscription payment path

**Objective:** Decide whether subscriptions are safe enough for mainnet or should be disabled until intent-bound.

**Files:**
- Read: `components/SubscribeButton.tsx`
- Read: `app/api/subscriptions/[creatorId]/route.ts`
- Modify depending on decision.

**Option A — Disable for mainnet initially:**
1. Add mainnet guard that hides/disables subscription purchase until intent-bound implementation exists.
2. Display `Subscriptions are devnet/demo only until mainnet hardening completes.`
3. Commit: `chore: disable subscriptions for mainnet until hardened`

**Option B — Harden subscriptions:**
1. Extend payment intent model to support subscription resource/plan, or create a subscription-specific intent table.
2. Create subscription intent endpoint.
3. Use server-provided memo in `SubscribeButton`.
4. Verify on-chain payment with expected memo, payer, creator, platform, amount.
5. Store receipt and mark consumed.
6. Add replay tests.
7. Commit in multiple small commits.

**Recommendation:** Option A for first mainnet smoke. Option B later. Faster, safer, less cute.

---

### Task 6: Add production observability without leaking secrets

**Objective:** Make failures diagnosable from Vercel logs without logging private data.

**Files:**
- Modify: `app/api/x402/[slug]/route.ts`
- Modify: `app/api/unlock/[slug]/route.ts`
- Possibly create: `app/api/health/route.ts`
- Create: `docs/ops-runbook.md`

**Steps:**
1. Add structured `console.info/warn/error` events with redacted-safe fields:
   - event name
   - slug/resource
   - status/reason
   - tx signature prefix/suffix only
   - intent ID prefix only
2. Add `/api/health` returning coarse checks:
   - app ok
   - DB ok
   - RPC ok
   - network
   - no secrets
3. Document Vercel commands:
   ```bash
   vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 30m --json
   vercel logs https://veloran-paywall-sage.vercel.app --no-follow --query 'payment.verify.failed' --json
   ```
4. Run local checks.
5. Commit:
   ```bash
   git add app/api docs/ops-runbook.md
   git commit -m "chore: add payment observability and ops runbook"
   ```

**Verification:** Logs show why payment failed, not secrets.

---

### Task 7: Human browser devnet verification

**Objective:** Confirm the patched `PaywallGate` works for real human Privy flow.

**Files:** none expected unless bugs found.

**Steps:**
1. Open production post in browser.
2. Sign in via Privy.
3. Fund test wallet with devnet SOL + USDC if needed.
4. Unlock post.
5. Confirm content shown.
6. Check Vercel logs for 200, no Prisma/Solana errors.
7. If replay is testable from browser/API, replay same tx and expect 409.

**Verification:** Human path matches agent path safety.

---

### Task 8: Tiny-value mainnet smoke procedure

**Objective:** Prepare exact checklist for the first real-USDC test, but do not run it yet.

**Files:**
- Create: `docs/mainnet-smoke-checklist.md`

**Steps:**
1. Define wallets:
   - fresh buyer wallet
   - creator wallet
   - treasury wallet
2. Define tiny price.
3. Define expected split.
4. Define rollback commands.
5. Define Vercel env var changes.
6. Define post-test assertions.
7. Commit:
   ```bash
   git add docs/mainnet-smoke-checklist.md
   git commit -m "docs: add mainnet smoke checklist"
   ```

**Verification:** Anyone can run smoke test without improvising.

---

## Suggested Execution Order

1. Task 1 — stale docs, low risk.
2. Task 2 — tests, high value.
3. Task 4 — config hardening, before touching mainnet.
4. Task 6 — observability.
5. Task 5 — subscription decision.
6. Task 3 — DB migration baseline, with extra care.
7. Task 7 — human browser devnet verification.
8. Task 8 — mainnet smoke checklist.

Reason: docs/tests/config/logging are cheap and reduce blindness. DB baseline is dangerous; do it after safeguards and with a backup plan.

---

## Commands To Run At Each Milestone

```bash
npm run test:payment-safety
npm run lint
npx tsc --noEmit
npm run build
```

After deploy:

```bash
vercel inspect https://veloran-paywall-sage.vercel.app | sed -n '1,45p'
vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 20m --json --limit 50
```

Agent E2E after relevant changes:

```bash
set -a; . ./.env.local; set +a
VELORAN_BASE_URL=https://veloran-paywall-sage.vercel.app \
AGENT_KEYPAIR_PATH=/root/.config/solana/agent.json \
NEXT_PUBLIC_SOLANA_RPC_URL="$NEXT_PUBLIC_HELIUS_RPC_URL" \
npm run ai-reader -- why-i-m-long-sol-into-fomc-ev8p0
```

---

## Risks / Open Questions

- **Prisma baseline risk:** We need exact production schema and a backup before marking migrations applied. Wrong baseline can make future migrations lie.
- **Subscription risk:** Current subscription path may not be intent-bound like x402 unlock. Treat as unsafe for mainnet until audited.
- **Mainnet program risk:** Need confirmed mainnet Anchor program ID and deployment authority/custody plan.
- **Treasury custody risk:** Need decide whether mainnet treasury is a hot wallet, multisig, or hardware-backed address.
- **RPC risk:** Public mainnet RPC is not acceptable for real payment verification. Use private server RPC.
- **Privy human flow risk:** Agent path is verified; human path must be manually tested post memo-fix.

---

## Approval Prompt

Recommended first execution batch:

1. Fix stale replay docs.
2. Add payment verification tests.
3. Harden Solscan/network config.
4. Add observability/runbook.

Then pause before DB baseline and subscription decision.

Wait for explicit approval before implementing.
