# Kimi 2.6 Hermes VPS Handoff — Veloran Design + Pitch Deck

Copy/paste this prompt into a Hermes session running on the VPS with the `implementer` profile.

Recommended launch command from VPS:

```bash
cd /root/veloran-astachain-clean
hermes -p implementer
```

Then paste this prompt.

---

You are Hermes running with the `implementer` profile, expected model `moonshotai/kimi-k2.6`, on the VPS.

Your job is to redesign/polish the Veloran web UI and create/improve the pitch deck artifact so Asta can record and submit to the Solana Frontier Hackathon.

You are NOT launching mainnet in this pass. Do not deploy to mainnet. Do not move Vercel production from devnet to mainnet. Do not touch secrets or print keypair contents.

## Source-of-truth anchor

Repo: https://github.com/astachain/veloran
VPS repo path: `/root/veloran-astachain-clean`
Branch: `main`
Expected starting commit: `fa92b367a30410a93dd73fd7fb686713484a3293` or newer `origin/main`
Live URL: https://veloran-paywall-sage.vercel.app
Current live network: Solana devnet

Start:

```bash
cd /root/veloran-astachain-clean
git fetch origin
git checkout main
git pull origin main
git status --short --branch
git rev-parse HEAD
```

If local files diverge, stop and report before overwriting.

## Product summary

Veloran is the seller-side publishing and settlement layer for paid resources in the agent economy.

One-liner:

> Veloran lets anyone publish paid resources that humans and AI agents can unlock with USDC on Solana — with direct, on-chain settlement to the seller.

Locked closing line:

> Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain.

Short pitch:

> Pay.sh helps agents discover and pay for established APIs. Veloran helps the long tail of creators, analysts, researchers, and developers publish paid resources of their own. A human sees a checkout. An agent sees HTTP 402. The same Anchor program settles the payment atomically: 95% to the seller, 5% to Veloran, no custody.

Do not frame Veloran as a generic payment gateway. Do not attack Pay.sh. Pay.sh is validation/complementary infrastructure.

## Current verified status

The live devnet product is already technically strong:

- Human browser Privy/wallet unlock passed on production devnet.
- Agent HTTP 402 unlock passed on production devnet.
- Replay rejection passed.
- Wrong memo rejection passed.
- Malformed signature no longer causes production 500.
- Payment verification tests pass: 23/23.
- Live health endpoint returns ok/db/rpc/devnet.

Important docs:

- `docs/plans/2026-05-09-mainnet-and-hackathon-sprint.md`
- `docs/mainnet-smoke-checklist.md`
- `docs/runs/2026-05-09-phase4-devnet-verification.md`
- `docs/pitch-deck.md`
- `docs/demo-script.md`
- `docs/submission-description.md`
- `docs/HANDOFF.md`

## Objective

Make Veloran look properly designed and hackathon-submission-ready.

Priorities:

1. Improve live web UI polish for recording:
   - landing page
   - `/for-agents`
   - `/demo`
   - public paywall page `/p/[slug]`
   - dashboard/post creation flow only if it affects recording
2. Create or improve a polished pitch deck artifact that Asta can export/submit.
3. Preserve all payment logic. Do not break devnet demo flows.
4. Keep scope tight. No redesign rabbit holes.

## Design direction

Use a premium developer-fintech style:

- Base mood: Linear + Vercel + Stripe, with Solana/violet accents.
- Dark-first, polished, technical, high-trust.
- Avoid generic AI-gradient slop. Gradients are allowed, but controlled.
- Strong hierarchy: headline, proof, CTA, product screenshots/cards.
- Use monospace sparingly for protocol/payment details.
- Make it feel like serious agent-payment infrastructure, not a crypto toy.

Suggested palette:

- Background: near-black / deep slate
- Primary text: off-white
- Secondary text: slate/zinc gray
- Accent: violet / Solana purple-green accents
- Cards: dark translucent surfaces with thin borders
- Code/protocol blocks: dark, crisp, readable

If you create a pitch deck as HTML, make it export-friendly to PDF: fixed slide sections, 16:9, no weird overflow.

## Files likely to edit

Inspect before editing:

- `app/page.tsx` — landing page
- `app/for-agents/page.tsx` — agent docs page
- `app/demo/page.tsx` — judge summary page
- `app/p/[slug]/page.tsx` — public paywall route if present
- `components/PaywallGate.tsx` — human unlock UI
- `components/DashboardClient.tsx` — dashboard/earnings UI
- `components/SubscribeButton.tsx` — subscription UI
- `app/globals.css` — global styles/tokens
- `docs/pitch-deck.md` — source deck content
- Create/update: `docs/pitch-deck.html` as a polished exportable deck artifact if useful

Avoid touching payment logic unless fixing a design-only import/build issue:

- `lib/x402.ts`
- `lib/payment-intents.ts`
- `lib/payment-intent-validation.ts`
- `app/api/unlock/[slug]/route.ts`
- `app/api/x402/[slug]/route.ts`
- `anchor/`
- `prisma/schema.prisma`

## Pitch deck requirements

Use `docs/pitch-deck.md` as the source. Keep these messages intact:

- Title: Veloran — the payment and access layer for the agent economy.
- Pay.sh proved demand; Veloran fills seller-side gap.
- Humans pay with checkout; agents pay with HTTP 402.
- 95/5 direct on-chain split via Anchor program.
- Open source GitHub: `github.com/astachain/veloran`
- Live URL: `veloran-paywall-sage.vercel.app`

Do not overclaim:

- Do not say official x402 compatibility. Say `x402-style`, HTTP 402, or custom `exact-veloran` scheme.
- Do not claim native binary file/dataset delivery. JSON/text-shaped payloads work today.
- Do not claim full app mainnet launch unless it actually happened.

## Verification before commit

Run at minimum:

```bash
npm run lint
npx tsc --noEmit
```

If possible also run:

```bash
npm run test
npm run build
```

For visual work, start local app if env permits:

```bash
npm run dev
```

Inspect:

- `/`
- `/for-agents`
- `/demo`
- one public paywall page
- dashboard if login/env permits

If local env blocks rendering, use the live URL for visual reference and keep changes static/build-safe.

## Git workflow

Use a branch:

```bash
git checkout -b design/kimi-final-polish
```

Commit in small chunks:

```bash
git add <files>
git commit -m "design: polish Veloran hackathon web UI"
git commit -m "docs: add polished pitch deck artifact"
```

Push:

```bash
git push -u origin design/kimi-final-polish
```

Do not merge to main without Asta/Merlin approval.

Every handoff must end with:

```text
Repo: https://github.com/astachain/veloran
Branch: <branch>
Latest pushed commit: <full SHA>
Push confirmation: local HEAD and origin/<branch> both match <full SHA>
Checks run: <commands + pass/fail>
Blocked: <anything requiring Asta>
Exact next action: <what Asta should do next>
```

## Mainnet warning for later, not this design pass

Asta said he holds the devnet wallet key but forgot which wallet is for deploy. Before any mainnet launch, verify that Asta actually controls the MAINNET deployer key, not only the devnet key.

Known old planned mainnet addresses:

- Planned mainnet deployer/treasury: `41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL`
- Planned mainnet program: `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`

The expected mainnet keypair files are NOT on this VPS. Earlier notes said they may be on Asta's local WSL:

- `~/.config/solana/veloran-mainnet-deployer.json`
- `~/.config/solana/veloran-mainnet-program.json`

Never print or paste keypair contents. Only public-key checks are acceptable later:

```bash
solana-keygen pubkey <path-to-mainnet-deployer.json>
solana-keygen pubkey <path-to-mainnet-program.json>
solana balance 41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL --url mainnet-beta
```

If Asta cannot confirm control of the mainnet deployer key, stop. Do not fund random addresses. Do not deploy from an unknown key.

Again: this mainnet section is only a reminder for later. Your current job is design + pitch deck + recording readiness.

## Success criteria

You are done when:

- Web UI looks recording-ready and premium.
- Pitch deck artifact is ready to export/share.
- Payment logic is untouched or still fully verified.
- Checks pass.
- Work is committed and pushed to a GitHub branch.
- Handoff includes repo/branch/commit/push confirmation.
