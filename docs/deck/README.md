# Veloran Pitch Deck

10-slide pitch deck for the Solana Frontier Hackathon. Implemented from a `claude.ai/design` (Anthropic Design) export, 2026-05-09.

## How to view

Serve the directory locally, then open `index.html` in a Chromium-based browser (Chrome, Brave, Edge, Arc) at full screen on a ≥1920×1080 display:

```bash
cd docs/deck
python3 -m http.server 8123
# then open:
# http://127.0.0.1:8123/index.html
```

Do **not** drag-drop/open `index.html` via `file://`. Babel-standalone loads the external JSX files with XHR, and Chromium blocks those `file://` requests with CORS. A tiny local HTTP server avoids that.

The deck is **fixed-width 1920px** by design. Smaller windows will horizontal-scroll; that's expected for a pitch-deck artifact (judges and presenters view at full screen, then export to PDF).

First paint takes ~1 second — Babel-standalone compiles the JSX in-browser. Subsequent loads are cached.

## How to export to PDF (for hackathon submission)

1. Open `index.html` in Chrome/Brave at full screen.
2. Click the **"Save as PDF"** button (top-right corner — fixed-position floating button).
3. Browser print dialog opens with the deck pre-paginated as one slide per page.
4. Destination: **Save as PDF**.
5. Layout: **Landscape**.
6. Paper size: **A4** or **Letter** — both work; the design's `@media print` rules scale to fit.
7. Margins: **None** (or "Default" if "None" leaves white edges).
8. Background graphics: **ON** — required to render the dark-violet brand correctly.
9. Save.

A successful export should be 10 pages, each filled edge-to-edge with a single slide.

## What the 10 slides contain

| # | Slide | What it shows |
|---|---|---|
| 1 | **Cover** | Tagline, live URL, GitHub, "Solana Frontier Hackathon · 2026" |
| 2 | **Problem** | Three pain cards: sellers, buyers, agents — one broken billing layer |
| 3 | **Solution** | Flow diagram: seller → resource URL → human/agent buyer → 95/5 on-chain split |
| 4 | **Human flow** | Three-frame storyboard of a Privy checkout unlock |
| 5 | **Agent flow (animated terminal)** | Live-typing terminal showing the x402 → pay → unlock loop |
| 6 | **On-chain split** | Anchor program diagram + devnet + mainnet program IDs visible |
| 7 | **Subscriptions** | Per-call vs subscription tier comparison |
| 8 | **Why now** | Three converging trends (Postman / IBM / Solana stablecoin rails) |
| 9 | **Roadmap** | Devnet today → mainnet next → SDK in 2026 |
| 10 | **Ask** | Three asks (prize, grant, seller intros) + closing line |

## Source files

| File | Purpose |
|---|---|
| `index.html` | Entry point. Loads React + Babel-standalone from CDN, mounts slides into a `<deck-stage>` web component. |
| `print.html` | Static print variant (alternate path if browser print breaks for any reason). |
| `styles.css` | Brand styles: dark `#0A0812` bg, violet `#8B5CF6` accent, geometric sans + Geist Mono, `@media print` page-break rules. |
| `deck-stage.js` | Custom `<deck-stage>` web component runtime (slide grid, navigation, keyboard arrows). |
| `slides-1-3.jsx` | Slide 1 (Cover), 2 (Problem), 3 (Solution). |
| `slides-4-6.jsx` | Slide 4 (Human), 5 (Agent terminal), 6 (Split). |
| `slides-7-10.jsx` | Slide 7 (Subs), 8 (WhyNow), 9 (Roadmap), 10 (Ask). |

## Editing slide content

All slide text lives in the three `slides-*.jsx` files. Each slide is a React functional component using inline-styled or class-styled JSX. To update a number, headline, or address: edit the JSX directly, save, refresh the browser. **No build step.**

Common edits:
- **URL changes** — search for `veloran.app` across the JSX files
- **Program IDs** — search for `2CtnLfde` (devnet) or `89ZFuq1` (mainnet)
- **Contact email** — `slides-7-10.jsx`, the closing-slide ask block
- **Closing one-liner** — `slides-7-10.jsx`, the `SlideAsk` component's `headline` h1

## Why React + Babel-standalone (and not Next.js)

This is a one-shot hackathon artifact for PDF export. It is intentionally NOT integrated into the Next.js app. Reasons:

1. **No build step** = anyone with a browser can edit + view, even after the hackathon
2. **Self-contained** = the entire deck is 7 files in this directory, no node_modules dependency
3. **Print-ready** = browser print dialog + `@media print` is the simplest way to get a clean PDF
4. **Survives forever** = no toolchain rot. Open it in 5 years, it'll still work.

## Provenance

Exported from `claude.ai/design` on 2026-05-09. Design transcript preserved at `~/anthropic-design-v2/veloran/chats/chat1.md` on Asta's local WSL (not committed — design-tool artifact, not source).

The `tweaks-panel.jsx` and `veloran-tweaks.jsx` files from the original Anthropic Design bundle are intentionally NOT copied into this directory — they are runtime style-iteration overlays for the design tool, not part of the production deck.
