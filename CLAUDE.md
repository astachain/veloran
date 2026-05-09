@AGENTS.md

# Veloran — payment and access layer for the agent economy

**Brand:** Veloran. **Tagline:** *"Veloran — the payment and access layer for the agent economy."*
**Hackathon:** Solana Frontier — submission due **May 10, 2026**.

## Product (one sentence)
Sellers publish paid APIs, dataset-shaped text payloads, and premium content with a single link. Humans pay with checkout; AI agents pay through HTTP 402 + `X-PAYMENT`. Platform takes 5%, split on-chain via an Anchor program.

## Team / who is building
- **Asta Chain** — product owner, directs implementation. Beginner coder (basic HTML, starting Python, no JS/TS). Domain: medical doctor, hospital administration, crypto trader, content creator.
- **Claude (Opus 4.7)** — writes all code. User reviews, tests, learns passively from diffs.

## Framework note

Scaffolded with **Next.js 16.2.4** (newer than training data). Read `node_modules/next/dist/docs/` before writing any page/route code. Respect deprecation notices in that version.

## Non-negotiables from the approved plan

- Everything on **Solana devnet** for the hackathon (no mainnet, no real funds)
- Demo-first: a working 2-minute video is the submission, not a production app
- Scope is locked — no creator-newsletter framing, no mobile app, no fiat onramp, no comments
- Every decision gets measured against "does this help the demo video land?"

## Tech stack (locked)

| Layer | Choice |
|---|---|
| Frontend | Next.js 16, Tailwind, shadcn/ui |
| Auth/Wallet | Privy embedded wallet (email login, no seed phrase) |
| On-chain (Rust) | Anchor 0.30 — single instruction `pay_for_content` w/ 95/5 split |
| On-chain (TS) | `@solana/web3.js` + Anchor TS client |
| x402 | `@proxies-sx/x402-solana` (primary) or Corbits or hand-rolled (fallback) |
| Data | Helius devnet RPC (free tier) |
| LLM | Vercel AI SDK → Claude Sonnet 4.6 for preview summaries |
| DB | SQLite (Prisma) local, Vercel Postgres in prod |
| Deploy | Vercel + Vercel Cron |

## Repo layout (target)

```
veloran/
├── app/
│   ├── page.tsx                       # Landing
│   ├── dashboard/page.tsx             # Creator: posts + earnings
│   ├── post/new/page.tsx              # Create paywall
│   ├── p/[slug]/page.tsx              # Public paywall page
│   └── api/
│       ├── posts/route.ts
│       ├── unlock/[slug]/route.ts     # x402-gated endpoint (wow demo)
│       ├── preview/route.ts           # Claude preview generator
│       └── earnings/route.ts
├── lib/
│   ├── privy.ts
│   ├── x402.ts
│   ├── anchor-client.ts
│   ├── content-gate.ts                # Signed session tokens
│   └── db.ts
├── anchor/
│   └── programs/veloran-paywall/src/lib.rs
├── prisma/schema.prisma
└── scripts/ai-reader.ts               # Demo AI agent that auto-pays
```

## Schedule (tight — 20 days total)

- **Apr 20–26**: Foundation + human-payment flow
- **Apr 27–May 3**: Anchor program + x402 + AI reader script
- **May 4–10**: Deploy, pitch deck, demo video, submit

Full day-by-day in the approved plan at `~/.claude/plans/c-users-user-claude-code-veloran-capita-eager-jellyfish.md`.

## Open decisions pending

- **WSL vs native Windows for Solana/Anchor** — decide before Apr 27. Native Windows toolchain is painful; WSL Ubuntu is the canonical path.
- **x402 SDK choice** — spike on Apr 29 between `@proxies-sx/x402-solana` and Corbits; fall back to hand-rolled if both flaky.

## Collaboration preferences (from root CLAUDE.md)

- Beginner-friendly explanations. No unexplained jargon.
- Default language: English. Indonesian if user writes Indonesian.
- Ask clarifying questions for discrete choices.
- *This project* is TypeScript/Rust — Claude writes all of it; user directs.

## The demo (what we're ultimately building toward)

Eight beats, two stories (human + AI), one closer. Full script in the plan file's "Verification" section. If every beat works on camera, we submit.

---

## Session resume notes (last updated 2026-05-09 afternoon — mainnet program deployed + custom domain live)

**Where we are:** Hackathon submission day. Two big milestones shipped today (May 9):

1. **Veloran program is live on Solana mainnet.**
   - Mainnet program ID: `89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j`
   - Mainnet treasury / upgrade authority: `8urcsZvfMnj8Rq3qo5Xk7PEDUQ7kS54cFTbPE6DxZsAD` (private keypair held by Asta with paper-mnemonic backup; old `41iGsC…` deployer was quarantined to `~/.config/solana/quarantine-2026-05-09/` and replaced with mnemonic-backed regeneration)
   - Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
   - Deploy tx: `3Kz1aXf24Uvm5bPZUoCqhGakkeLwZtamAHFYJAMaeHiDD9q4aQ6DDtTr8Pw8ramMhkV6kvHMM5yF9TosVWWJnGeH`
   - Smoke test (real `pay_for_content`, 0.05 USDC self-loop): `2J5G1ttrLH8EVGSfAwPCfR6QhbZV2kgcwBVYaV7uQ9apR5iKrDnzmkmWwHB3Y5RHA1sEwWCpUEZaH5w1uapr81nM`
   - Built via `anchor build -- --features mainnet`. Cargo feature gates the program ID + USDC + treasury constants in `anchor/programs/veloran-paywall/src/lib.rs`. Default build (no flag) still produces the devnet binary at `2CtnLfde…`.
   - Source committed in `15c9354 feat: deploy Veloran program to Solana mainnet`.

2. **Custom domain `https://veloran.app` is live on Vercel.**
   - Cloudflare Registrar + Cloudflare DNS, manual setup, gray-cloud (DNS only, NOT proxied)
   - Apex CNAME → `dd0217c7572bc076.vercel-dns-017.com.`
   - `www.veloran.app` 307-redirects to apex
   - HSTS active, SSL via Vercel/Let's Encrypt
   - Privy Allowed Origins updated to include both `https://veloran.app` and `https://www.veloran.app`
   - Sign-in flow verified working on the new domain

**The live app is still on devnet.** Vercel env vars unchanged; `lib/solana.ts` still reads devnet constants. The mainnet program is independent, on-chain, audit-ready, but NOT yet wired to the frontend. That's intentional per the May 9 sprint plan (`docs/plans/2026-05-09-mainnet-and-hackathon-sprint.md`) — flipping the app to mainnet without Phase 4 hardening would create real-money risk for zero pitch benefit.

**Where Asta is right now:** on a break. Returning to record the demo video.

**Active handoff to Hermes:** `docs/handoffs/2026-05-09-hermes-deck-script-domain-mainnet-update.md` (commit `5479d8b`). Hermes will update `docs/demo-script.md` + `docs/pitch-deck.md` + `docs/pitch-deck.html` + `README.md` + `docs/submission-description.md` to reflect the new domain + mainnet program ID. Code/env unchanged.

**When Asta returns:**
1. `git pull` to fetch Hermes's doc updates
2. Read the updated demo script aloud — tweak any awkward phrasing
3. Re-export the pitch deck as PDF (or build visual deck from updated `docs/pitch-deck.md`)
4. Record 2:30 demo video on Loom using the updated script and `https://veloran.app`
5. Submit to Solana Frontier portal: live URL + GitHub + video URL + deck PDF + description

**Submission package fields ready when video is done:**
- Live URL: `https://veloran.app`
- GitHub: `https://github.com/astachain/veloran`
- Devnet program: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS` (live demo hero)
- Mainnet program: `89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j` (production-ready)
- Submitter: Asta Chain / `dr.adityasaputra@gmail.com`

**Locked closing line (verbatim everywhere):**
> *Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain.*

---

## Session resume notes (last updated 2026-04-29 evening, mainnet keypairs generated — awaiting funding)

**Where we are:** All build work complete. Positioning v2 shipped (payment + access layer for the agent economy). Two new pages live (`/for-agents`, `/demo`). Pitch deck rewritten to prompt's 10-slide structure. **Mainnet hybrid plan approved + keypairs generated.** Next gate: user funds the mainnet deployer with ~1.05 SOL.

**To resume next session, the very next step is:**

1. Check whether funding landed:
   ```bash
   wsl -d Ubuntu -- bash -lc "solana balance ~/.config/solana/veloran-mainnet-deployer.json --url mainnet-beta"
   ```
2. If balance ≥ 1 SOL → proceed with Block 4 (apply Cargo feature flags) through Block 8 (deploy + smoke test + commit). The full step-by-step is in the plan file at `~/.claude/plans/c-users-user-claude-code-veloran-capita-eager-jellyfish.md` under section **"Apr 29+ — Mainnet program deploy (hybrid…)"**.
3. If still unfunded → user is still acquiring SOL. Pause; do NOT spend cycles on anything else until funding is decided.

**Mainnet hybrid scope (locked via grill, Apr 29):**
- ✅ Program will deploy to mainnet alongside the existing devnet deployment
- ❌ Demo recording stays on devnet (zero real-money risk during takes)
- Funding: fresh deploy keypair, ~1.05 SOL ($200) from user's trading wallet
- Treasury = same as deploy keypair (mirrors devnet setup)
- Build via Cargo features (`mainnet` feature flag, same source compiles to either binary)

**Mainnet keypairs generated (Apr 29 evening, NOT yet funded):**
- Deployer + Treasury (mainnet): `41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL`
  - Keypair file: `~/.config/solana/veloran-mainnet-deployer.json` (WSL Ubuntu)
  - User needs to send ~1.05 SOL to this address from their trading wallet
- Mainnet Program ID (planned): `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`
  - Keypair file: `~/.config/solana/veloran-mainnet-program.json` (WSL Ubuntu)
  - Empty by design — this is the program's address, not a wallet
- Solscan deployer: https://solscan.io/account/41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL
- Solscan future program: https://solscan.io/account/Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz (will populate after deploy)

**Devnet deployment unchanged + still working:**
- Devnet program: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
- Devnet treasury: `DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP`
- Live URL: https://veloran-paywall-sage.vercel.app/ (devnet, will stay devnet)

**Positioning v2 landed (Apr 29 afternoon, commit `b7873f4`):**
- Headline: "Veloran — the payment and access layer for the agent economy."
- Subhead: "Sell APIs, datasets, and premium content that humans and AI agents unlock with USDC on Solana."
- New pages: `/for-agents` (developer docs with real x402 wire format) and `/demo` (judge-facing 2-min summary)
- Landing rebuilt: hero + 3 differentiator features + how-it-works + use-cases + why-now + why-Solana + closing CTA + footer
- `docs/pitch-deck.md` restructured to 10-slide format from the user's Positioning Prompt
- `docs/demo-script.md` rewritten with API-flagship voiceover + suggested JSON-shaped test post
- Zero code-logic changes (Anchor program, schema, API routes, AI reader, auth, subscriptions all unchanged)

**Recent commits (latest first):**
- `b7873f4` — Positioning v2: payment + access layer for the agent economy (4 files + 2 new pages)
- `7790631` — Earlier positioning shift (now superseded by v2)
- `155c1e5` — SubscribeOptions wrapper (one sign-in button when logged out)
- `aa8f348` — Polish round 2 (creator self-view, upgrade path, AuthRefresh)
- `f01aeb6` — Polish: DB-backed sub state, navigation, label fixes
- `c8e78a0` — Wallet-verification follow-ups (router.refresh after subscribe, byline, $ padding)

**To re-run the AI reader on prod (still works, regression-free):**
```bash
cd ~/veloran
VELORAN_BASE_URL=https://veloran-paywall-sage.vercel.app \
  AGENT_KEYPAIR_PATH=~/.config/solana/agent.json \
  npm run ai-reader -- <slug>
```

**Schedule (~10 days remaining to May 10 deadline):**
- Apr 30: mainnet deploy (after funding lands) — Blocks 4-8 of the mainnet plan, ~1 day
- May 1-2: deck visual design (user, in Claude artifacts, using `docs/pitch-deck.md` as content source)
- May 3-5: demo video recording on devnet (using `docs/demo-script.md`)
- May 6-8: buffer
- May 9: submit
- May 10: deadline

**Solana dev skill installed:** `~/.agents/skills/solana-dev` — symlinked to Claude Code. Will auto-load next session. Useful for future Anchor/Solana questions.

---

## Session resume notes (last updated 2026-04-29, subscriptions shipped + wallet verified + deck/script written)

**Where we are:** Build phase fully complete. Subscriptions live. Wallet sign-in verified end-to-end. Pitch deck content + demo video script committed. Remaining work is **execution-only**: visual design of the deck, recording the video, submitting. ~11 days of buffer remain.

**Live URL:** https://veloran-paywall-sage.vercel.app/ — covers per-post + subscription + email-login + wallet-login (Phantom).

**Resume next session — the only paths from here:**
- **A.** Demo video recording — user follows `docs/demo-script.md` (2:30, 9 beats + wallet cutaway), records in Loom. Budget half a day. Claude can review takes, suggest re-cuts, write subtitle text if needed, but cannot record.
- **B.** Deck visual design — user is doing this themselves in Claude artifacts (or wherever) using `docs/pitch-deck.md` as the content source. Claude can review final deck draft, tighten copy, suggest visual refinements.
- **C.** Submission packaging — once deck PDF + Loom URL + description are ready, submit to the Solana Frontier portal. Description copy can lean on pitch-deck.md slides 1, 3, 5, 6.
- **D.** Late polish — only if a real bug surfaces during dress rehearsal. Keep urge-to-tweak under control: every change is a re-test.

**What landed since the Apr 27 session save:**

Subscription feature build (3 days, 4 commits):
- ✅ `a08f77d` — Day 1: Schema (SubscriptionTier + Subscription) + verifyOnChainPayment refactored from post-shaped to recipient-shaped + content-gate sub tokens. Schema pushed to Neon (non-destructive).
- ✅ `610c99c` — Day 2: API routes (`/api/subscriptions/[creatorId]`, `/api/subscription-tiers`) + `/api/earnings` extended (backward-compat) + `/c/[address]` public profile page + `SubscribeButton` component.
- ✅ `fbf0242` — Day 3: `CreatorTierEditor` on dashboard + `/p/[slug]` checks subscription cookie + PaywallGate "Subscribe" upsell link + EarningsPanel breaks out per-post vs sub revenue + recent subscriptions list.
- ✅ `f01aeb6` — Polish round 1: DB-backed sub state (replaces unreliable cookie check), navigation footers on /p/[slug], "Update subscription" label, `$` overlap fix.
- ✅ `aa8f348` — Polish round 2: creator self-view banner on /c/[address], upgrade-to-yearly path for monthly subs, `AuthRefresh` component (server re-render after Privy login), "Your dashboard →" footer on /c.
- ✅ `155c1e5` — Polish round 3: `SubscribeOptions` wrapper collapses two "Sign in to subscribe" buttons into one when logged out.

Wallet sign-in verification (Apr 28-29):
- ✅ Spec at `docs/specs/2026-04-28-wallet-signin-verification.md` (commit `0416278`)
- ✅ Plan in `~/.claude/plans/c-users-user-claude-code-veloran-capita-eager-jellyfish.md` ("Wallet sign-in verification execution plan" section)
- ✅ All 5 flows verified PASS on prod (sign-in, /api/me upsert, unlock, subscribe+gate, creator+tier). Phantom on devnet, fresh incognito, fully end-to-end.
- ✅ Outcome: **demo-ready**. 5-second wallet cutaway between video beats 4 and 5.
- ✅ `c8e78a0` — Wallet-verification follow-ups: SubscribeButton calls router.refresh() after success (prevents accidental double-subscribe), byline fallback shows short address for wallet users (was "anon"), `$` padding pl-7 → pl-8 on tier editor.

Documentation (Apr 29):
- ✅ `79c0876` — Pitch deck content outline: `docs/pitch-deck.md`. 10 slides with headlines, body, visual notes, speaker notes. Tone guidance + words to avoid + words to use.
- ✅ `7904eb8` — Demo video script: `docs/demo-script.md`. 2:30 voiceover with [time] marks, screen actions per beat, 4-window pre-flight checklist, production tips, submission package.

**Live demo artifacts (no change since Apr 27):**
- Live URL: https://veloran-paywall-sage.vercel.app/
- Test post slug: `why-i-m-long-sol-into-fomc-ev8p0` ($0.50)
- Anchor program (devnet): `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
- Treasury: `DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP`
- Agent keypair: `~/.config/solana/agent.json`, address `3P6V…VmYB`
- Test subscription tier: monthly $1, yearly $10

**Known small follow-ups noted but NOT blocking the demo:**
- `/dev/send-usdc` shows generic "failed" message when wallet has insufficient USDC. Better message would say "not enough USDC". Won't appear in the demo video (we use faucets for funding).
- Edit-post / edit-pricing UX is on the future-features shelf. Defer until after submission.
- Sharing buttons / comments / likes on posts — same shelf.

**To re-run the AI reader on prod (still works, regression-free):**
```bash
cd ~/veloran
VELORAN_BASE_URL=https://veloran-paywall-sage.vercel.app \
  AGENT_KEYPAIR_PATH=~/.config/solana/agent.json \
  npm run ai-reader -- <slug>
```

**Schema re-push to Neon (only if schema drifts again):**
```bash
DATABASE_URL='<pooled-neon-url-from-Vercel-Storage-tab>' npx prisma db push
```

---

## Session resume notes (last updated 2026-04-27 afternoon, ALL 8 BEATS VERIFIED LIVE)

**Where we are:** The product is shippable. Live URL works end-to-end against a real Postgres database, with both the human-payment beat AND the autonomous-AI-agent beat verified on prod. Remaining work is pure publishing: pitch deck → demo video → submit. ~12 days ahead of plan.

**Live URL:** https://veloran-paywall-sage.vercel.app/

**Resume next session — three options to choose from:**
- **A.** Draft the pitch deck (10 slides as Markdown outline → user puts into Google Slides or Pitch.com). ~90 min
- **B.** Write the 2-minute demo video voiceover script (beat by beat, ready to record in Loom). ~30 min
- **C.** Internal dress rehearsal — full demo end-to-end on the live URL with timer running, then iterate

**Smoke test verified live (all 8 beats):**
- Beat 1 (creator login): Privy email login → embedded Solana devnet wallet auto-created, dashboard renders ✅
- Beat 2 (create paywall): `/post/new` form with Claude preview generator, post slug auto-generated ✅
- Beat 3 (reader sees preview): incognito window, blurred content, violet Unlock button ✅
- Beat 4 (reader unlocks): Privy modal → `useSignAndSendTransaction` → on-chain SPL transfer routed through Anchor program → cookie set → content revealed + Solscan link ✅
- Beat 5 (AI agent unlocks): `npm run ai-reader -- <slug>` against live URL — 402 challenge → autonomous on-chain payment via pay_for_content → re-fetch with X-PAYMENT header → content printed ✅. Tested signature: `56upSAXhSWdpKpMA...`
- Beat 6 (earnings dashboard): EarningsPanel shows lifetime $0.95, 2 unlocks, "1 human"/"1 agent" pills, both Solscan links ✅
- Beat 7 (Solscan proof): every unlock tx visible on devnet — both human + agent ✅
- Beat 8 (closer): pure pitch, no code

**Live demo artifacts:**
- Live URL: `https://veloran-paywall-sage.vercel.app/`
- Live test post slug: `why-i-m-long-sol-into-fomc-ev8p0` ($0.50)
- Creator account on prod: contact via GitHub: @astachain
- Reader account on prod: same Privy app + same email = same embedded wallet as local (`9Y59...Tm2TZ`, ~5 USDC remaining)
- Agent keypair: `~/.config/solana/agent.json`, address `3P6V...VmYB`, ~1 USDC remaining
- Anchor program (devnet): `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
- Treasury: `DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP`

**To re-run the AI reader on prod (Beat 5) for any slug:**
```bash
cd ~/veloran
VELORAN_BASE_URL=https://veloran-paywall-sage.vercel.app \
  AGENT_KEYPAIR_PATH=~/.config/solana/agent.json \
  npm run ai-reader -- <slug>
```

**Bugs fixed during the prod smoke test (all in commits already on GitHub):**
- `960cbfa` — Dashboard 401 race on first login with empty DB (fix: gate posts/earnings fetch on `me` being loaded). Hit when prod DB is empty; local never saw it because Creator row already existed.
- `c267578` — `$` overlapping price digits on `/post/new` (pl-6 → pl-7).

**What landed today (Apr 27):**
- ✅ GitHub repo: `https://github.com/astachain/veloran` (public)
- ✅ WSL git remote pointed at GitHub, credentials stored in `~/.git-credentials`
- ✅ Prisma schema flipped `sqlite` → `postgresql` (commit `018f2b2`)
- ✅ Old SQLite migrations/ folder removed
- ✅ `.npmrc` with `legacy-peer-deps=true` for Vercel CI (commit `7d37d38`)
- ✅ `package.json`: `build` now runs `prisma generate && next build`; `postinstall` also runs `prisma generate`
- ✅ Vercel project `veloran-paywall` created, GitHub-connected
- ✅ All env vars added: NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET, NEXT_PUBLIC_SOLANA_NETWORK=devnet, NEXT_PUBLIC_HELIUS_RPC_URL, SESSION_SECRET (fresh prod secret, not the dev one), ANTHROPIC_API_KEY
- ✅ Neon Postgres attached via Storage → injected DATABASE_URL + companions
- ✅ `npx prisma db push` against Neon → tables created (verified: Creator, Post, Unlock)

**New commits since last session save (now on GitHub):**
- `7d37d38` — Add .npmrc with legacy-peer-deps=true for Vercel build
- `018f2b2` — Switch Prisma provider to postgresql for Vercel deploy

**Production-only env vars (Vercel project) — DO NOT commit these to repo:**
- `SESSION_SECRET` = `6dAzKxjOxwY0ELwTmgClFKZ/9+sJSOdA7oRvaJBJsydWWyO10MYtBE65bya8RWFf` (regenerate with `openssl rand -base64 48` if leaked)
- `DATABASE_URL` (Vercel-managed, pooled Neon URL)

**Open items for the live URL once it works:**
- Production DB starts empty — no test posts. User needs to log in fresh and create demo posts on prod.
- Update the AI reader script env: `VELORAN_BASE_URL=<live-url> npm run ai-reader -- <slug>`
- Privy dashboard: may need to add the production URL to Privy's "Allowed Origins" list (privy.io console → app settings)

**One thing to double-check after deploy:** the `Anthropic()` SDK constructor in `app/api/preview/route.ts` reads `ANTHROPIC_API_KEY` from process.env automatically. Confirmed working locally. Should also work on Vercel since the env var is set.

**Known good Postgres connection (use only for emergency `prisma db push` re-runs):** the pooled Neon URL is in the user's clipboard / Vercel storage tab; do NOT hard-code it anywhere. To re-push schema if it ever drifts:
```bash
DATABASE_URL='<pooled-neon-url>' npx prisma db push
```

---

## Session resume notes (last updated 2026-04-28, end of Week 2 day 6)

**Progress:** All planned features built. ~4 days ahead of plan. Remaining work is publishing (deploy, deck, video, submit).

**Latest commits (WSL only — Windows origin still at 2b27899):**
- `e581a6f` — Day 6 W2: Claude preview generator on /post/new
- `10db36c` — Session save (Apr 28): Week 2 day 5 complete
- `1fd5bf2` — Day 5 W2: AI reader script + dev send-usdc helper
- `dfecf98` — Day 4 W2: Creator earnings dashboard
- `3637649` — Day 3 W2: x402-style endpoint /api/x402/[slug]
- `1ad791c` — Day 2 W2: route unlock through Anchor program
- `59359a3` — Day 1 W2: Anchor pay_for_content deployed to devnet
- `f195f72` — Session save: WSL toolchain installed
- (Week 1 history above this in Windows origin)

**End-to-end verified beats:**
- Beat 1–4 (human story): browser → Privy → pay 0.5 USDC → content reveals + cookie persists
- Beat 5 (agent story): `npm run ai-reader -- <slug>` → 402 challenge → on-chain pay → content
- Beat 6 (earnings): dashboard EarningsPanel shows lifetime $ + human/agent pill counts
- Beat 7 (Solscan): every unlock tx visible at `solscan.io/tx/<sig>?cluster=devnet`, program at `solscan.io/account/2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS?cluster=devnet`
- Beat 8 (closer): pure pitch, no code

**Devnet artifacts:**
- Program ID: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
- Treasury: `DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP` (= deploy keypair)
- Test post slug: `why-i-m-long-sol-into-fomc-gli90` ($0.50)
- Human reader Privy wallet: `9Y59DuDPLunps2ripujxYUXgytycvfRvwgeJHh8Tm2TZ` (~7.5 USDC remaining)
- Agent keypair file: `~/.config/solana/agent.json`, address `3P6VDakhDkEhweHN6uz96RjtzoevGZNndFU3EoYLVmYB`

**What works end-to-end:**
- Privy email login → embedded Solana devnet wallet (auto-created)
- `/dashboard`: creator profile + post list + unlock counts
- `/post/new`: title/preview/content/price form, slug auto-generated
- `/p/[slug]`: public paywall page; creator sees content directly (banner), reader sees blurred + Unlock button
- Real USDC SPL transfer reader → creator on devnet via `useSignAndSendTransaction`
- Server verifies tx (creator ATA delta + reader ATA debit), creates `Unlock` row, sets HMAC-signed cookie `vlr_unlock_<slug>` (7d TTL)
- Refresh-safe: server reads cookie, renders unlocked
- Solscan tx link shown after fresh unlock
- Existing test post: slug `why-i-m-long-sol-into-fomc-gli90`, $0.50

**Known infra notes:**
- `NEXT_PUBLIC_HELIUS_RPC_URL` still has placeholder — falls back to `api.devnet.solana.com`. User can drop key in for better rate limits.
- `SESSION_SECRET` still the dev-only string — fine until prod
- `ANTHROPIC_API_KEY` still placeholder — needed when we build the Claude preview generator
- `x402@0.7.3` transitive dep of Privy — verify on Apr 29 SDK spike

**Version notes (still relevant):**
- Next.js 16.2.4 (Promise params, async cookies()) — read `node_modules/next/dist/docs/` before page code
- Tailwind 4 (PostCSS plugin, no tailwind.config.js)
- Prisma 6 (NOT 7 — schema.prisma has `url` directly)
- React 19 / Privy 3.22.1 / @solana/web3.js 1.98 / @solana/spl-token 0.4

**Open decisions:** none currently blocking — toolchain decision RESOLVED (Option A, WSL Ubuntu).

## WSL toolchain — INSTALLED + VERIFIED (2026-04-26)

**Canonical workspace is now `~/veloran` inside WSL Ubuntu.** The Windows copy at `C:\Users\User\CLAUDE CODE\Veloran Capital\veloran` is the git origin but no longer where dev happens. To sync the Windows copy with new commits, the user needs to manually `git push` from WSL — but git refuses to push into a non-bare checked-out branch by default. Easier flow: edit CLAUDE.md / docs from Windows (commit there), then `git pull origin main` from WSL on resume.

**Installed in WSL Ubuntu:**
- gcc 13.3.0 (build-essential + libssl-dev + libudev-dev + pkg-config)
- rustc 1.95.0
- solana-cli 3.1.14 (Agave) — config set to devnet, keypair at `~/.config/solana/id.json`, balance 5 SOL (web faucet — devnet airdrop CLI was rate-limited)
- avm + anchor-cli 0.31.1 (NOT 0.30.1 — see version note below)
- node v20.20.2 / npm 10.8.2

**Critical version note:** Plan said Anchor 0.30. **Anchor 0.30.1 does NOT compile on Rust 1.95** — `proc-macro2::Span::source_file` was removed in newer proc-macro2, breaks `anchor-syn 0.30.1`. Pinned to **Anchor 0.31.1** for both CLI (avm) and crate (`anchor-lang = "0.31.1"` in `programs/veloran-paywall/Cargo.toml`). Build succeeds clean.

**Project state in WSL (~/veloran):**
- Full repo cloned from Windows path. `git log` matches Windows up to commit `2b27899`.
- `npm install --legacy-peer-deps` completed (1188 packages, 23 non-critical vulns ignored).
- `.env.local`, `.env`, `prisma/dev.db` copied over from Windows.
- Anchor workspace scaffolded at `~/veloran/anchor/`:
  - `programs/veloran-paywall/src/lib.rs` — default scaffold with `declare_id!("KrJCJYARa5cW1jXe9ojLRPAiaWKMddmCZLiKHm5oYSU")` and empty `initialize` instruction
  - `Anchor.toml` — cluster: Devnet; `[programs.devnet]` references `veloran_paywall = "KrJC..."` (note: program ID is the Anchor-generated default; user's deploy keypair will not match — must regenerate ID with `anchor keys list` + `anchor keys sync` before first deploy)
  - `programs/veloran-paywall/Cargo.toml` — pinned `anchor-lang = "0.31.1"`, package name `veloran-paywall`, lib name `veloran_paywall`
- `anchor build` ✅ succeeds, produces `target/deploy/veloran_paywall.so`

**Important: program ID needs regeneration before first deploy.** The default `KrJC...` ID came from the Anchor scaffold; the actual ID is derived from the deploy keypair Anchor generates at `target/deploy/veloran_paywall-keypair.json`. Run `anchor keys list` to see the real one, then `anchor keys sync` to update both `lib.rs` `declare_id!` and `Anchor.toml`. Do this before writing the program logic so the ID is stable.

**No commits made in WSL yet.** All Anchor scaffold files are uncommitted in `~/veloran`.

**Polish pass results (Apr 25 session):**
- ✅ Landing page glow-up (commit 707777f)
- ✅ Delete post button (same commit)
- ⏭️ Still available: Claude preview generator (~45 min) — needs ANTHROPIC_API_KEY in .env.local

**Next session — publishing phase:**
1. **GitHub repo + Vercel deploy** (~60–90 min) — biggest risk surface. SQLite → Vercel Postgres migration, env-var checklist, build/runtime fixes. **Resolve the WSL-vs-Windows origin issue here**: create GitHub repo, push WSL → GitHub, set both Windows + WSL clones to use GitHub as origin. Stop using the file:// remote.
2. **Internal dress rehearsal** — full demo end-to-end on the live URL
3. **Pitch deck** (~90 min) — 10 slides per the plan's "Verification (the demo script)" section
4. **Demo video** (~60 min) — 2-min Loom, scripted voiceover, 8 beats
5. **Submit** (target May 9, deadline May 10)

**Vercel deploy gotchas to remember:**
- Env vars only load on boot — every change = redeploy
- ANTHROPIC_API_KEY, NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET, NEXT_PUBLIC_HELIUS_RPC_URL, SESSION_SECRET, DATABASE_URL all need to land in Vercel project settings
- DATABASE_URL switches from `file:./dev.db` to a Vercel Postgres connection string. Schema's `provider` line in `prisma/schema.prisma` will need to flip from `sqlite` to `postgresql`
- The `prisma/dev.db` file is local only — production starts with empty DB; user needs to log in fresh + create demo posts on prod
- Build command: `prisma generate && next build` (currently just `next build` — Vercel may need `prisma generate` before build)
- The Anchor `target/` directory is gitignored; Vercel doesn't need it (the Next.js app only imports the IDL JSON, which IS committed at lib/idl/)

**Optional polish still on the shelf (none blocking):**
- Agent earnings PDA on-chain (current dashboard pulls from SQLite; "off-chain" reading)
- Bring `dev/send-usdc` behind an admin gate (currently anyone logged in can send their OWN USDC — actually fine UX)
- Multi-post AI reader: `npm run ai-reader -- --all` reads every paywall in sequence
- Rename Windows folder from "Veloran Capital" to just "Veloran"

**Demo dependencies that must work on the live URL:**
- Privy login flow (test with both fresh + existing emails)
- Helius RPC (or fall back to api.devnet.solana.com — already coded)
- USDC faucets (Circle's was flaky Apr 28; `/dev/send-usdc` is the bypass)
- AI reader script connects to live URL via `VELORAN_BASE_URL=<vercel-url>`

**Faucet pain note:** Circle's devnet USDC faucet (https://faucet.circle.com) was unreachable on Apr 28. Fallback `/dev/send-usdc` lets the human Privy wallet bankroll any test address. Use this whenever a fresh test wallet needs USDC.

**Demo artifacts to remember:**
- Test post: `/p/why-i-m-long-sol-into-fomc-gli90` ($0.50)
- Program ID: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
- Treasury: `DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP`
- Agent address: `3P6VDakhDkEhweHN6uz96RjtzoevGZNndFU3EoYLVmYB` (~1.5 USDC remaining after Apr 28 testing)
- Human reader Privy wallet: `9Y59DuDPLunps2ripujxYUXgytycvfRvwgeJHh8Tm2TZ` (~5.5 USDC remaining)

**Punted / known UX gaps:**
- No edit post route (delete-and-recreate is the workaround)
- Dashboard route is shown to any logged-in user, not just creators (fine for MVP)
- No rate limiting on `/api/posts` or `/api/unlock` (acceptable for hackathon devnet demo)

**How to resume dev server:**
```
cd "C:\Users\User\CLAUDE CODE\Veloran Capital\veloran"
npm run dev
```

**Key files (current map):**
- Pages: `app/page.tsx`, `app/dashboard/page.tsx`, `app/post/new/page.tsx`, `app/p/[slug]/page.tsx`
- API: `app/api/me/route.ts`, `app/api/posts/route.ts`, `app/api/unlock/[slug]/route.ts`
- Lib: `lib/db.ts`, `lib/privy-server.ts`, `lib/solana.ts`, `lib/content-gate.ts`, `lib/slug.ts`
- Components: `Providers.tsx`, `LoginButton.tsx`, `DashboardClient.tsx`, `NewPostClient.tsx`, `PaywallGate.tsx`
- Schema: `prisma/schema.prisma` (Creator, Post, Unlock)

