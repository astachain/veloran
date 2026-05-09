# Veloran Mainnet + Hackathon Final Sprint — 2026-05-09

> **For Hermes / external coders:** GitHub is the source of truth. Assume the next coder has no VPS access. Clone `https://github.com/astachain/veloran`, branch `main`, then verify the latest commit before touching anything.

**Goal:** Submit Veloran to Solana Frontier on time, with a credible mainnet story and no reckless real-money launch.

**Blunt verdict:** The devnet product is strong enough to submit. Full app mainnet launch is not the next move unless the mainnet program keypairs, deployer funding, mainnet RPC, and tiny-USDC smoke wallet are available. Shipping hackathon submission beats trying to improvise real-money production at the buzzer.

---

## Current anchor

- Repo: https://github.com/astachain/veloran
- Branch: `main`
- Last known pushed commit before this sprint plan: `844455d2dbd50dbf5d7ba56a3744143b770d8017`
- Live app: https://veloran-paywall-sage.vercel.app
- Current live network: Solana devnet
- Health: `{ "app":"ok", "db":"ok", "rpc":"ok", "network":"devnet" }`

## What is already proven

- Human browser Privy/wallet unlock passed on live production devnet.
- Agent HTTP 402 unlock passed on live production devnet.
- Replay rejection passed.
- Wrong memo rejection passed.
- Malformed signature no longer 500s.
- Payment verification tests pass: 23/23.
- Prisma migration baseline is anchored.
- Health endpoint works.
- Run doc: `docs/runs/2026-05-09-phase4-devnet-verification.md`

## Mainnet reality check

### Mainnet deployment blockers

1. Mainnet deployer/program keypairs are not present on the VPS:
   - Expected user-local WSL path from old handoff: `~/.config/solana/veloran-mainnet-deployer.json`
   - Expected deployer/treasury pubkey: `41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL`
   - Expected program pubkey: `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`
2. Mainnet deployer funding is unknown and cannot be checked from this VPS without the keypair or a direct public-address balance check.
3. Full app mainnet mode requires explicit Vercel env vars:
   - `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
   - `NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
   - `NEXT_PUBLIC_VELORAN_PROGRAM_ID=<mainnet deployed program>`
   - `NEXT_PUBLIC_VELORAN_TREASURY=<mainnet treasury public key>`
   - `SERVER_SOLANA_RPC_URL=<private mainnet RPC>`
4. Subscriptions should not be advertised as mainnet-live unless they are smoke-tested with real USDC or explicitly kept devnet/demo only.

### Safe mainnet scope for hackathon

Best scope: **hybrid**.

- Keep the live app and demo recording on devnet.
- If funding/keypairs are ready, deploy only the Anchor program to mainnet and run one tiny smoke transaction.
- Pitch it as: “Devnet app demo, mainnet program readiness/smoke proven.”
- Do not flip the production app to mainnet unless the tiny-value smoke passes and the user explicitly accepts real-money risk.

## Final sprint priorities

### P0 — Submit package, no excuses

1. Verify live app still renders.
2. Verify `/api/health` still returns ok.
3. Record demo video using `docs/demo-script.md`.
4. Export/share pitch deck from `docs/pitch-deck.md`.
5. Use `docs/submission-description.md` for portal copy.
6. Submit with:
   - Live URL: `https://veloran-paywall-sage.vercel.app`
   - GitHub: `https://github.com/astachain/veloran`
   - Demo video URL
   - Deck PDF/share URL
   - Devnet program: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`

### P1 — Mainnet program deploy, only if prerequisites are ready

Run from the machine that has the mainnet keypairs. Never paste keypair contents into chat.

1. Check deployer SOL balance:
   ```bash
   solana balance 41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL --url mainnet-beta
   ```
2. If balance is under deployment needs, stop and submit devnet. Do not delay submission.
3. If funded, apply feature-gated mainnet constants in the Anchor program.
4. Build with mainnet feature.
5. Deploy program to mainnet.
6. Run tiny smoke transaction with tiny USDC.
7. Update docs with mainnet program + smoke tx.
8. Commit and push.

### P2 — Full app mainnet, after hackathon unless explicitly approved

Full app mainnet requires a separate launch checklist:

- dedicated mainnet Privy/wallet UX review
- private mainnet RPC
- real treasury custody decision
- tiny price/resource
- fresh buyer wallet with tiny SOL + USDC
- rollback plan
- Vercel env switch
- one human mainnet unlock
- one agent mainnet unlock
- replay check
- log review

Do not do this casually. Real-money bugs are not “demo polish”; they are expensive little goblins.

## Commands already verified this session

```bash
npm run test
npm run lint
npx tsc --noEmit
curl -sS https://veloran-paywall-sage.vercel.app/api/health
```

Result:

- Payment safety smoke: ok
- Payment verification tests: 23/23 passed
- ESLint: passed
- TypeScript: passed
- Health: ok/db/rpc/devnet

## Hackathon positioning to keep

One-liner:

> Veloran lets anyone publish paid resources that humans and AI agents can unlock with USDC on Solana — with direct, on-chain settlement to the seller.

Short pitch:

> Pay.sh helps agents discover and pay for established APIs. Veloran helps the long tail of creators, analysts, researchers, and developers publish paid resources of their own. A human sees a checkout. An agent sees HTTP 402. The same Anchor program settles the payment atomically: 95% to the seller, 5% to Veloran, no custody.

Do not claim:

- official x402 compatibility; say `x402-style` / HTTP 402 with custom `exact-veloran`
- native binary dataset/file delivery; JSON/text-shaped payloads work today
- full mainnet app launch unless it actually happened

## Final handoff format

Every handoff must include:

- Repo URL
- Branch
- Latest pushed commit hash
- Push confirmation: local HEAD equals `origin/main`
- Live URL
- What passed
- What is blocked
- Exact next action
