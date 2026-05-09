# Kimi 2.6 Local WSL Handoff — Veloran Design + Pitch Deck

Copy/paste this whole prompt into the local Kimi 2.6 coding/design session.

---

You are Kimi 2.6 working locally on Asta's WSL Ubuntu machine. Your job is to revise Veloran's visual design and pitch deck so the product is demo-recording-ready for the Solana Frontier Hackathon.

You are NOT launching mainnet in this pass. Do not deploy to mainnet. Do not move Vercel production from devnet to mainnet. Do not touch secrets or print keypair contents. Mainnet comes later after the design/deck/video sprint.

## Non-negotiable source-of-truth anchor

Use GitHub as the shared state anchor. Assume other agents do not have this local filesystem or VPS access.

Repo: https://github.com/astachain/veloran
Branch: main
Latest pushed commit to start from: 46cf9d18a9e0c2bdb3cd2bb91df78db413c3c14b
Live URL: https://veloran-paywall-sage.vercel.app
Current live network: Solana devnet

Start with:

```bash
cd ~
# If repo does not exist locally:
git clone https://github.com/astachain/veloran.git
cd veloran

# If repo already exists:
git fetch origin
git checkout main
git pull origin main
git rev-parse HEAD
```

Expected starting HEAD should be `46cf9d18a9e0c2bdb3cd2bb91df78db413c3c14b` or a newer `origin/main` commit if another agent already pushed. If local files diverge, stop and ask Asta before overwriting.

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

## Your objective

Make Veloran look properly designed and hackathon-submission-ready.

Priorities, in order:

1. Improve the live web UI polish for recording:
   - landing page
   - `/for-agents`
   - `/demo`
   - public paywall page `/p/[slug]`
   - dashboard/post creation flow only if it affects recording
2. Create or improve a polished pitch deck artifact that Asta can export/submit.
3. Preserve all existing payment logic. Do not break devnet demo flows.
4. Keep the scope tight. We have little time. No cute redesign rabbit holes.

## Design direction

Use a premium developer-fintech style:

- Base mood: Linear + Vercel + Stripe, with Solana/violet accents.
- Dark-first, polished, technical, high-trust.
- Avoid generic AI-gradient slop. Gradients are allowed, but must be controlled.
- Strong hierarchy: headline, proof, CTA, product screenshots/cards.
- Use monospace sparingly for protocol/payment details.
- Make it feel like a serious agent-payment infrastructure product, not a crypto toy.

Suggested palette:

- Background: near-black / deep slate
- Primary text: off-white
- Secondary text: slate/zinc gray
- Accent: violet / Solana purple-green accents
- Cards: dark translucent surfaces with thin borders
- Code/protocol blocks: dark, crisp, readable

If you create a pitch deck as HTML, make it export-friendly to PDF: fixed slide sections, 16:9, no weird overflow.

## Files likely to edit

Inspect before editing; these names are likely relevant:

- `app/page.tsx` — landing page
- `app/for-agents/page.tsx` — agent docs page
- `app/demo/page.tsx` — judge summary page
- `app/p/[slug]/page.tsx` — public paywall route if present
- `components/PaywallGate.tsx` — human unlock UI
- `components/DashboardClient.tsx` — dashboard/earnings UI
- `components/SubscribeButton.tsx` — subscription UI
- `app/globals.css` — global styles/tokens
- `docs/pitch-deck.md` — source deck content
- Create if useful: `docs/pitch-deck.html` or improve existing deck artifact if present

Do not edit payment verification logic unless you discover a design-only import/build issue. Avoid touching:

- `lib/x402.ts`
- `lib/payment-intents.ts`
- `lib/payment-intent-validation.ts`
- `app/api/unlock/[slug]/route.ts`
- `app/api/x402/[slug]/route.ts`
- `anchor/`
- `prisma/schema.prisma`

## Pitch deck requirements

Use `docs/pitch-deck.md` as the content source. Keep these messages intact:

- Title: Veloran — the payment and access layer for the agent economy.
- Pay.sh proved demand; Veloran fills seller-side gap.
- Humans pay with checkout; agents pay with HTTP 402.
- 95/5 direct on-chain split via Anchor program.
- Open source GitHub: `github.com/astachain/veloran`
- Live URL: `veloran-paywall-sage.vercel.app`

Do not overclaim:

- Do not say official x402 compatibility. Say `x402-style`, HTTP 402, or custom `exact-veloran` scheme.
- Do not claim native binary file/dataset delivery. JSON/text-shaped payloads are what works today.
- Do not claim full app mainnet launch unless it actually happened.

Deliverable options:

- Best: create/update `docs/pitch-deck.html` as a beautiful 16:9 HTML deck that can print/export to PDF.
- Also okay: tighten `docs/pitch-deck.md` visual notes and create `docs/pitch-deck-design-notes.md`.

## Local setup commands

Use WSL Ubuntu shell.

```bash
cd ~/veloran
npm install
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

For local dev:

```bash
npm run dev
```

Then open the local URL in browser, usually:

```text
http://localhost:3000
```

If env vars are missing, do not invent secrets. Use the live URL for visual reference and make static/design changes that do not require private envs.

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

Manually inspect these pages locally or live after deploy:

- `/`
- `/for-agents`
- `/demo`
- one public paywall page
- dashboard if logged in and env permits

## Git workflow

Use a branch unless Asta explicitly says direct main is okay:

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

If working directly on `main`, push only after checks pass:

```bash
git push origin main
```

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

Asta says he forgot which wallet is for deployment, but he holds the devnet wallet key. Before any mainnet launch, you must verify that Asta actually holds and controls the MAINNET deployer key, not only the devnet key.

Known old planned mainnet addresses from earlier handoff:

- Planned mainnet deployer/treasury: `41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL`
- Planned mainnet program: `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`
- Old expected local WSL keypair paths:
  - `~/.config/solana/veloran-mainnet-deployer.json`
  - `~/.config/solana/veloran-mainnet-program.json`

Before mainnet, run public-key checks only. Do NOT print private key file contents.

```bash
solana-keygen pubkey ~/.config/solana/veloran-mainnet-deployer.json
solana-keygen pubkey ~/.config/solana/veloran-mainnet-program.json
solana balance 41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL --url mainnet-beta
```

Expected:

- Deployer pubkey should match `41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL` if using the old planned wallet.
- Program pubkey should match `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz` if using the old planned program key.

If Asta cannot confirm he holds the mainnet deployer key, STOP. Do not fund random addresses. Do not deploy from an unknown key. Create a new mainnet deployer wallet, save it securely, confirm Asta controls it, then update docs before funding.

Again: this mainnet section is only a reminder for the later launch phase. Your current job is design + pitch deck + recording readiness.

## Success criteria

You are done when:

- Web UI looks recording-ready and premium.
- Pitch deck artifact is ready to export/share.
- Payment logic is untouched or still fully verified.
- Checks pass.
- Work is committed and pushed to GitHub.
- Handoff includes repo/branch/commit/push confirmation.
