# Hermes Handoff — Update demo script + pitch deck for mainnet program + custom domain

**Created:** 2026-05-09 (afternoon, after mainnet program deploy)
**For:** Hermes session running with the `implementer` profile on the VPS
**Caller:** Asta — taking a break, will return to record demo video
**Repo:** https://github.com/astachain/veloran
**VPS path:** `/root/veloran-astachain-clean`
**Branch:** `main`
**Expected starting commit:** `15c9354` or newer `origin/main`

---

## Why this handoff exists

Two big things shipped earlier today that the docs don't yet reflect:

1. **Veloran program is deployed to Solana mainnet** (in addition to the existing devnet deploy).
2. **Custom domain `veloran.app` is live on Vercel** with HTTPS, HSTS, Privy auth verified.

The pitch deck and demo script still reference the old `veloran-paywall-sage.vercel.app` URL and don't mention the mainnet program. Asta will record the demo video as soon as both are updated. Update the script and deck so they match today's reality.

**You are NOT changing application behavior** — no `lib/`, `components/`, or `app/` code edits. No Vercel env var changes. No network flip. **Documentation only.**

---

## Start from a clean repo state

```bash
cd /root/veloran-astachain-clean
git fetch origin
git checkout main
git pull --ff-only origin main
git status --short --branch
git rev-parse HEAD
```

If local files diverge, stop and report before overwriting.

The latest commit you should see is at least `15c9354 feat: deploy Veloran program to Solana mainnet (89ZFuq1…2bDLa1j)`.

---

## Source of truth — facts you will reference

### Live URLs

- **Canonical (new, use this everywhere going forward):** `https://veloran.app`
- **Alternate (old Vercel-suffix, still works):** `https://veloran-paywall-sage.vercel.app`
- `https://www.veloran.app` 307-redirects to `https://veloran.app` (canonical = apex)

### Program IDs

- **Devnet program (used by the live app):** `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
  - Solscan: https://solscan.io/account/2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS?cluster=devnet
- **Mainnet program (deployed today, audit-ready, NOT yet wired to the app):** `89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j`
  - Solscan (no cluster suffix = mainnet): https://solscan.io/account/89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j

### Mainnet on-chain evidence

- **Deploy transaction:** `3Kz1aXf24Uvm5bPZUoCqhGakkeLwZtamAHFYJAMaeHiDD9q4aQ6DDtTr8Pw8ramMhkV6kvHMM5yF9TosVWWJnGeH`
  - Solscan: https://solscan.io/tx/3Kz1aXf24Uvm5bPZUoCqhGakkeLwZtamAHFYJAMaeHiDD9q4aQ6DDtTr8Pw8ramMhkV6kvHMM5yF9TosVWWJnGeH
- **Smoke test transaction (real `pay_for_content` invocation, 0.05 USDC self-loop):** `2J5G1ttrLH8EVGSfAwPCfR6QhbZV2kgcwBVYaV7uQ9apR5iKrDnzmkmWwHB3Y5RHA1sEwWCpUEZaH5w1uapr81nM`
  - Solscan: https://solscan.io/tx/2J5G1ttrLH8EVGSfAwPCfR6QhbZV2kgcwBVYaV7uQ9apR5iKrDnzmkmWwHB3Y5RHA1sEwWCpUEZaH5w1uapr81nM
- **Mainnet treasury / upgrade authority:** `8urcsZvfMnj8Rq3qo5Xk7PEDUQ7kS54cFTbPE6DxZsAD` (private keypair held by Asta with paper-mnemonic backup)
- **Mainnet USDC mint (standard, Circle):** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

### Build invocation for the mainnet binary (already done; reference only)

```bash
cd /root/veloran-astachain-clean/anchor
anchor build -- --features mainnet
```

The Cargo `mainnet` feature gates the `declare_id!`, `USDC_MINT`, and `TREASURY` constants in `anchor/programs/veloran-paywall/src/lib.rs`. Default build (no flag) still produces the devnet binary at `2CtnLfde…`.

---

## Locked positioning (do not change)

- One-liner: *Veloran lets anyone publish paid resources that humans and AI agents can unlock with USDC on Solana — with direct, on-chain settlement to the seller.*
- Closing line: *Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain.*
- Pay.sh framing: validation + complementary infrastructure, NOT competition. Do not attack Pay.sh.

---

## Files to modify

### 1. `docs/demo-script.md`

#### 1a. URL replacement (everywhere)

Replace every occurrence of `veloran-paywall-sage.vercel.app` with `veloran.app`. There are likely 4–6 instances (window setup, AI reader command, closer slide, submission package). Use:

```bash
rg -n 'veloran-paywall-sage\.vercel\.app' docs/demo-script.md
```

…then replace each. The Vercel-suffix URL still resolves, but the demo should consistently use the cleaner canonical domain.

#### 1b. Beat 8 — Solscan proof voiceover

Currently mentions only the devnet program. Update the voiceover to mention BOTH program IDs:

> *"This is our Anchor program. Deployed on Solana devnet at `2CtnLfde…2pGcS` for the demo recording — and also deployed on mainnet at `89ZFuq1…DLa1j`, audit-ready, with a verified `pay_for_content` smoke test on-chain."*

The screen action stays the same (showing the devnet program account on Solscan). The voiceover gains a new closing sentence about the mainnet deploy. Keep Beat 8 within ~15 seconds total.

#### 1c. Beat 9 closer

Use the locked closing line verbatim:

> *"Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain."*

The closer slide (the static black-screen shot) should also list both addresses + the new domain. Suggested:

```
              Veloran
The payment and access layer for the agent economy.

           https://veloran.app
        github.com/astachain/veloran

  devnet:   2CtnLfde…2pGcS  (live demo)
  mainnet:  89ZFuq1…DLa1j   (deployed)
```

#### 1d. Pre-flight checklist

In the table at the top of the script, update:
- W2 (Buyer Chrome incognito) URL: change from `https://veloran-paywall-sage.vercel.app/p/<api-slug>` to `https://veloran.app/p/<api-slug>`
- W3 (Terminal) `VELORAN_BASE_URL`: change from `https://veloran-paywall-sage.vercel.app` to `https://veloran.app`
- W4 (Solscan tab): keep the devnet Solscan link as-is (recording uses devnet)

#### 1e. Submission package section

Update the "live URL" entry to `https://veloran.app`. Add two new rows:
- "Devnet program: 2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS"
- "Mainnet program: 89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j"

### 2. `docs/pitch-deck.md`

#### 2a. URL replacements

Same sweep as 1a — replace `veloran-paywall-sage.vercel.app` with `veloran.app` throughout. Run:

```bash
rg -n 'veloran-paywall-sage\.vercel\.app' docs/pitch-deck.md
```

#### 2b. Slide 9 (Demo / proof)

This is the most important deck change. Currently the slide proves devnet. Add mainnet evidence as a parallel bullet. Suggested updated bullet list:

```markdown
**Bullets:**
- ✅ Live on Solana devnet — full human + agent flow at https://veloran.app
- ✅ Anchor program deployed on Solana mainnet — `89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j`
- ✅ Mainnet smoke test passed — real `pay_for_content` invocation, on-chain split verified
- ✅ Open source: github.com/astachain/veloran
```

Add a footer line under slide 9:

> *Mainnet program is deployed and audit-ready; the live app stays on devnet through the hackathon submission. Mainnet activation is a separate launch decision, not a hackathon deliverable.*

#### 2c. Slide 10 (Vision / closing)

- Replace the closing line text with the locked one-liner: *Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain.*
- Footer block: replace the URL with `https://veloran.app` (drop the Vercel-suffix variant — it's a fallback, not the canonical).

#### 2d. Roadmap (slide if present)

If there's a roadmap section listing "Q3 2026 mainnet deploy" or similar — soften it. The mainnet program is **already deployed today**. The remaining mainnet work is hardening + activation, not deploy. Suggested rephrasing:

> *Today: devnet app + mainnet program deployed. Q3 2026: Phase 4 hardening + tiny-value mainnet activation.*

### 3. `docs/pitch-deck.html`

This is the rendered HTML deck (Kimi-polished). Mirror the slide-9 + slide-10 + closer content from the markdown deck. URL replacement (`veloran-paywall-sage.vercel.app` → `veloran.app`) should happen here too. Confirm the HTML still renders cleanly in browser after edits.

```bash
rg -n 'veloran-paywall-sage\.vercel\.app|2CtnLfde' docs/pitch-deck.html
```

### 4. `docs/submission-description.md`

Read it. If it mentions only the Vercel-suffix URL or only the devnet program, update to:
- Use `https://veloran.app` as the live URL
- Add a sentence about the mainnet program deploy + smoke test

Stay within the 200-500 word target. Don't pad.

### 5. `README.md`

Probably needs the new domain too. Check:

```bash
rg -n 'veloran-paywall-sage\.vercel\.app' README.md
```

Also check if the README has an "On-chain artifacts" or similar section where the mainnet program ID should be added.

---

## Files to NOT modify

- `lib/solana.ts`, `lib/x402.ts`, `lib/payment-intents.ts`, `lib/payment-memo.ts` — code stays exactly as is. Live app continues to read devnet constants.
- `app/**` — UI is Kimi-polished and verified working. Only touch if a stale URL reference is hardcoded somewhere (rare; flag back to Asta if found).
- `components/**` — same.
- `prisma/schema.prisma` — no schema changes.
- `anchor/**` — already updated by the mainnet deploy commit; do not touch.
- `scripts/mainnet-smoke-test.ts` — already committed; do not modify.
- Any `.env*` files — none of them get committed; never paste env values into chat or commits.

---

## Verification before commit

```bash
cd /root/veloran-astachain-clean
npm run lint
npx tsc --noEmit
npm run test:payment-safety
npm run test:payment-verification

# URL sweep — should return zero hits except in deliberately-kept fallback notes
rg -n 'veloran-paywall-sage\.vercel\.app' README.md app docs components scripts | grep -v 'fallback\|alternate'

# Mainnet program ID should appear in deck slide 9 + demo script Beat 8
rg -n '89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j' docs/pitch-deck.md docs/demo-script.md
```

If any verification fails, fix before committing.

---

## Commit + push

Single commit. Suggested message:

```
docs: update deck + demo script for veloran.app + mainnet program

- Demo script: replace veloran-paywall-sage.vercel.app with veloran.app
  throughout. Beat 8 voiceover now mentions both devnet (2CtnLfde…) and
  mainnet (89ZFuq1…) program IDs. Beat 9 closer + closer slide updated
  with locked one-liner and mainnet program ID.
- Pitch deck (md + html): same URL replacement. Slide 9 (proof) gains
  mainnet program bullets + smoke-test reference. Slide 10 closer uses
  the locked one-liner. Roadmap softened (mainnet deploy is today, not
  Q3).
- README + submission-description: live URL is veloran.app. Mainnet
  program ID added where appropriate.

No code/behavior changes. No Vercel env changes. No network flip.
Live app stays on devnet for the demo recording per the May 9 sprint
plan; mainnet program is deployed and audit-ready independently.

Mainnet program: 89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j
Smoke tx:       2J5G1ttrLH8EVGSfAwPCfR6QhbZV2kgcwBVYaV7uQ9apR5iKrDnzmkmWwHB3Y5RHA1sEwWCpUEZaH5w1uapr81nM
```

```bash
git add docs/ README.md
git commit -m "<above>"
git push origin main
```

---

## When Asta returns

Asta will:
1. Pull origin/main on their machine
2. Read the updated demo script for any final tweaks
3. Re-export `docs/pitch-deck.html` as PDF (or use Pitch.com / Canva to build the visual deck from the updated `docs/pitch-deck.md`)
4. Record the 2:30 demo video on Loom using the updated script + the live URL `https://veloran.app`

Make sure the script reads cleanly aloud — Asta is the narrator and will tweak any phrasing that's awkward to say. Prefer short declarative sentences in the voiceover.

---

## Out of scope (do not touch)

- ❌ Phase 4 hardening tasks (those are in `docs/plans/2026-05-09-phase-4-executor-plan.md` — separate work item)
- ❌ Vercel env vars
- ❌ Mainnet activation of the live app
- ❌ Subscription path on mainnet
- ❌ The Anchor program source (it's correct as-deployed)
- ❌ Recording the demo video (Asta does that personally)
- ❌ Keypair files / mnemonics — never reference, never print

If anything in your scan suggests a code change is needed (not just docs), STOP and post a comment in the next commit's `git log` body for Asta to review.

---

## Definition of done

- [ ] `rg 'veloran-paywall-sage\.vercel\.app' docs README.md` returns ≤1 hit (only in a clearly-labeled "alternate URL" note if any)
- [ ] `rg '89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j' docs/pitch-deck.md docs/demo-script.md README.md` returns at least 3 hits (one per file)
- [ ] `rg '2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS' docs/pitch-deck.md docs/demo-script.md` still has hits (devnet program is the demo's hero — keep it)
- [ ] Locked closing line appears in `docs/pitch-deck.md` slide 10 AND `docs/demo-script.md` Beat 9
- [ ] All standing checks (`lint`, `tsc --noEmit`, `test:payment-safety`, `test:payment-verification`) pass
- [ ] Single commit on main, pushed, no push errors
- [ ] No code files modified

When done, post a one-line summary in the commit body so Asta sees it on `git log`.
