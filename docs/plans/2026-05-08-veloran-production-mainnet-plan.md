# Veloran Production + Mainnet Implementation Plan

> For Hermes: Use subagent-driven-development skill if executing this plan task-by-task.

Goal: Move Veloran from hackathon/devnet demo to a real production product with custom domain, self-hosted app infrastructure, production database, and Solana mainnet settlement.

Architecture: Keep the current Next.js app as the product shell, but remove devnet hardcoding and make cluster/payment settings environment-driven. Deploy the web app on a VPS with Docker, Caddy HTTPS, Postgres, backups, monitoring, and a clean domain. Deploy a separate audited mainnet Solana program using mainnet USDC and a production treasury wallet.

Tech Stack: Next.js 16, Prisma, Postgres, Docker, Caddy/Nginx, Solana Anchor, SPL Token USDC, Helius/paid RPC, Privy production app.

---

## Phase 0: Stabilize current hackathon deployment

Objective: Keep the Vercel deployment alive while preparing production.

Tasks:
1. Confirm astachain GitHub repo is source of truth: `git remote -v` must show `astachain/veloran`.
2. Keep Vercel as temporary demo hosting only.
3. Do not put real mainnet secrets or treasury keys into Vercel.
4. Add a README note later: current deployment is devnet demo.

Verification:
- https://veloran-paywall-sage.vercel.app loads.
- GitHub repo is https://github.com/astachain/veloran.

---

## Phase 1: Domain and production hosting decision

Objective: Choose and prepare the real public home for Veloran.

Recommended default:
- Buy/use a domain such as `veloran.xyz`, `veloran.io`, or `veloran.app`.
- Use Cloudflare for DNS and basic protection.
- Host the app on a VPS first, not Kubernetes. Kubernetes now would be cosplay engineering.

VPS baseline:
- 2 vCPU / 4 GB RAM minimum for early production.
- Ubuntu LTS.
- Docker + Docker Compose.
- Caddy for automatic HTTPS.
- Postgres container or managed Postgres.

Verification:
- Domain points to VPS.
- HTTPS works.
- `/health` endpoint returns OK.

---

## Phase 2: Make config environment-driven

Objective: Remove devnet hardcoding before mainnet.

Files to modify:
- `lib/solana.ts`
- `lib/x402.ts`
- `.env.example`
- app copy that says devnet only: `app/page.tsx`, `app/for-agents/page.tsx`, `app/demo/page.tsx`

Required env vars:
- `NEXT_PUBLIC_SOLANA_NETWORK=devnet|mainnet-beta`
- `NEXT_PUBLIC_SOLANA_RPC_URL=`
- `SERVER_SOLANA_RPC_URL=`
- `NEXT_PUBLIC_USDC_MINT=`
- `NEXT_PUBLIC_VELORAN_PROGRAM_ID=`
- `VELORAN_TREASURY=`

Acceptance criteria:
- Devnet and mainnet configs can run from env without code edits.
- Build fails loudly if mainnet env is incomplete.
- UI displays the active network clearly.

Verification:
- `npm run lint`
- `npx tsc --noEmit`
- devnet deployment still works.

---

## Phase 3: Fix payment replay and intent binding before mainnet

Objective: Prevent users or agents from reusing one valid payment signature for multiple unlocks.

Current risk:
- `verifyOnChainPayment()` verifies that a transaction paid enough USDC to the creator and platform.
- But production needs a consumed-signature table and ideally a payment intent/memo binding the payment to a specific resource, price, creator, and payer.

Required changes:
1. Add `PaymentIntent` model in Prisma.
2. Add `ConsumedPayment` or `PaymentReceipt` model with unique `txSignature`.
3. Challenge response must include an intent ID / nonce.
4. Payment transaction should include Memo or program-level reference when possible.
5. Unlock endpoint must atomically mark signature as consumed.

Acceptance criteria:
- Same `txSignature` cannot unlock twice.
- A payment for post A cannot unlock post B.
- A payment for lower price cannot unlock higher price.
- A payment to a different creator cannot unlock this creator's content.

Verification:
- Unit tests for replay rejection.
- Integration test with a valid payment then repeated unlock attempt.

---

## Phase 4: Production database

Objective: Replace SQLite dev setup with Postgres production setup.

Tasks:
1. Update `DATABASE_URL` to Postgres.
2. Add Docker Compose service or managed Postgres.
3. Run Prisma migrations properly.
4. Add backup script.
5. Add restore drill command.

Acceptance criteria:
- Production app runs against Postgres.
- Backups exist and restore is tested.

Verification:
- `npx prisma migrate deploy`
- create/read/update test content works.

---

## Phase 5: Mainnet Solana program deployment

Objective: Deploy Veloran settlement program on Solana mainnet-beta.

Required constants:
- Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Production treasury wallet: new astachain-controlled wallet, preferably hardware wallet or multisig.
- New mainnet program ID: generated during deployment.

Tasks:
1. Create production treasury wallet.
2. Create deployment authority wallet separate from treasury.
3. Update Anchor program constants for mainnet.
4. Run Anchor tests locally.
5. Deploy to devnet one more time with mainnet-style config.
6. Deploy to mainnet-beta.
7. Record program ID, upgrade authority, treasury, and deployed slot.

Acceptance criteria:
- Program only accepts mainnet USDC mint.
- Treasury ATA receives 5%.
- Creator ATA receives 95%.
- Upgrade authority is secured, not sitting casually on the VPS like a loaded gun on a café table.

Verification:
- Mainnet test with smallest practical USDC amount.
- Explorer link confirms program invocation and split.

---

## Phase 6: Self-hosted app deployment

Objective: Host Veloran outside Vercel on the real domain.

Files to create:
- `Dockerfile`
- `docker-compose.yml`
- `Caddyfile`
- `.env.production.example`
- `scripts/backup-postgres.sh`
- `scripts/deploy.sh`

Deployment model:
- Caddy terminates HTTPS.
- Next.js app runs as Docker container.
- Postgres runs as managed DB or Docker volume.
- Secrets are stored only on server, never committed.

Verification:
- `https://<domain>/` loads.
- `https://<domain>/for-agents` loads.
- API routes work.
- Logs can be tailed.
- Server survives reboot.

---

## Phase 7: Production safety and launch checklist

Objective: Avoid mainnet money footguns.

Checklist:
- Rate limiting on unlock/payment APIs.
- Consumed payment signatures enforced.
- Error logging without leaking secrets.
- RPC provider key not exposed unless intended as public browser key.
- Privy production app configured with real domain.
- Terms/disclaimer page added.
- Admin/content moderation path defined.
- Treasury wallet backup and recovery written down offline.
- Monitoring for 5xx errors, RPC failures, and failed payment verification.

Launch order:
1. Deploy app on domain in devnet mode.
2. Verify app health.
3. Deploy mainnet program.
4. Switch staging domain to mainnet env.
5. Test with tiny USDC.
6. Switch production domain to mainnet.
7. Announce.

---

## Immediate next task

Start with Phase 2 and Phase 3 before touching mainnet.

Mainnet without replay protection is a bad idea. It may work in a demo, but real money turns tiny flaws into expensive comedy.
