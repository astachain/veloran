# Claude Design handoff prompt — Veloran pitch deck

Use this prompt in Claude Design to create the final Veloran hackathon pitch deck. The repo is the source of truth.

---

## Prompt to paste into Claude Design

You are Claude Design acting as an expert deck designer and visual systems designer.

Design a polished 10-slide hackathon pitch deck for Veloran, aligned with the existing Veloran brand and logo. I already designed the Veloran logo in Claude Design, so preserve the same premium dark/violet product identity and do not reinvent the logo direction.

Use this GitHub repo as the handoff/source of truth:
https://github.com/astachain/veloran

Read these repo files before designing:
- `docs/pitch-deck.md` — slide content source of truth
- `docs/pitch-deck.html` — current rough HTML deck/export baseline
- `docs/submission-description.md` — concise product description
- `docs/demo-script.md` — demo narrative and final positioning
- `app/page.tsx`, `app/demo/page.tsx`, `app/for-agents/page.tsx`, `app/globals.css` — existing product visual language
- `README.md` — repo/project context

Goal:
Create a visually excellent, judge-ready pitch deck for the Solana Frontier Hackathon. It should feel like premium crypto infrastructure, not a generic SaaS creator deck.

Core positioning to preserve:
- Veloran is the payment and access layer for the agent economy.
- Sell APIs, dataset-shaped payloads, and premium content that humans and AI agents unlock with USDC on Solana.
- Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain.

Avoid using this as the main tagline:
- “Substack for the agent economy.”
It can be used only as an optional casual analogy if needed, but not in the hero/title slide or closing slide.

Preferred main tagline:
“Veloran is the payment and access layer for the agent economy.”

Preferred closer:
“Publish once. Humans pay with checkout. Agents pay with HTTP 402. Sellers get paid directly on-chain.”

Audience:
Solana hackathon judges, crypto infrastructure builders, and AI-agent/product people. They should understand in under 90 seconds:
1. what Veloran is,
2. why agents need a payment path,
3. why Solana matters,
4. what is already working,
5. why the 95/5 on-chain split is the memorable moat.

Design direction:
- Dark background, premium infrastructure feel.
- Violet accent family already used by the app/logo, roughly `#8B5CF6`, `#A78BFA`, `#C084FC`.
- Use restrained gradients, subtle glow, and precise typography.
- Technical but not cluttered.
- Use monospace only for code, addresses, transaction/program IDs, and protocol details.
- Avoid generic glassmorphism, fake dashboards, cartoon illustrations, random icons, and rainbow gradients.
- It should feel closer to Linear/Vercel-quality crypto infra than a newsletter creator tool.

Deck format requirements:
- 16:9 deck, 1920×1080 canvas.
- 10 slides, matching `docs/pitch-deck.md` structure.
- One main idea per slide.
- Keep the copy concise; tighten language if needed, but do not invent strategic claims.
- Include slide numbers or subtle progress markers.
- Export-ready for PDF.
- Prefer a self-contained HTML deck artifact with embedded CSS/JS, plus PDF export if supported.
- Include keyboard navigation if making HTML.
- No speaker notes on the visual slides.

Brand and content constraints:
- Do not change product behavior or claim features that are not implemented.
- Be honest that native binary file/dataset delivery is roadmap; current dataset use is text-shaped JSON/CSV-style payloads.
- The live app stays on devnet for hackathon demo.
- Mainnet Anchor program is deployed and smoke-tested, but mainnet activation is separate from hackathon demo.
- Emphasize non-custodial/direct settlement and atomic 95/5 split.

Important facts to include accurately:
- Live URL: `https://veloran.app`
- GitHub: `github.com/astachain/veloran`
- Devnet program: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`
- Mainnet program: `89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j`
- Payment split: 95% seller / 5% Veloran platform
- Human flow: Privy email login or Phantom wallet checkout
- Agent flow: HTTP 402/x402 challenge, signed Solana transaction, `X-PAYMENT` header, gated response returned after verification

Slide structure to preserve from `docs/pitch-deck.md`:
1. Title — Veloran as payment/access layer for agent economy
2. Problem — premium digital resources are still sold like 2015
3. Why now — agentic AI, x402, Solana USDC liquidity
4. Solution + validation — Pay.sh/Cloudflare direction, Veloran seller-side gap
5. Product/how it works — sign in, publish, get paid
6. Why Solana — low fees, fast settlement, custom program, USDC liquidity
7. Use cases — paid API endpoints, text-shaped datasets, premium writing, subscriptions
8. Market direction — APIs as revenue products, agents becoming buyers
9. Demo/proof — devnet live, mainnet program deployed/smoke-tested, open source
10. Vision/closing — today, roadmap, final closer

Visual suggestions:
- Slide 1: strong logo/wordmark lockup, one-line positioning, minimal proof footer.
- Slide 4 or 5: show “one URL, two payers” split: Human checkout path vs AI agent HTTP 402 path.
- Slide 6 or 9: make the Anchor settlement split memorable: Buyer USDC → Anchor program → 95% Seller + 5% Veloran.
- Slide 9: use program IDs in a clean proof panel, not a wall of text.
- Slide 10: end with URL and GitHub, not a busy roadmap slide.

Deliverables:
1. A designed HTML deck suitable for direct browser viewing and PDF export.
2. A PDF export if your environment supports it.
3. If you make design choices not directly from the repo, summarize the rationale briefly.

Quality bar:
This should look like something a serious infrastructure startup would submit, not a markdown deck with decorations. Make the on-chain 95/5 settlement and agent HTTP 402 flow unforgettable.

---

## Notes for the human/operator

After Claude Design creates the deck, verify these before submission:

- Slide 1 uses “payment and access layer for the agent economy,” not “Substack for the agent economy.”
- Slide 7 does not overclaim native binary dataset delivery.
- Slide 9 has both program IDs exactly correct.
- The deck exports cleanly to PDF at 16:9.
- The final slide includes `https://veloran.app` and `github.com/astachain/veloran`.
