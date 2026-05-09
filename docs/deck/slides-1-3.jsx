/* global React */
const { useState, useEffect, useRef } = React;

// --- Cover V monogram (v1.4 clock-hand) ---
function VMark({ size = 520 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <defs>
        <linearGradient id="vgrad-ink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="vgrad-creator" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <radialGradient id="vglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
          <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#vglow)" />
      {/* writer (15% shorter) */}
      <path d="M 53 68 A 7 7 0 0 1 67 68 L 100 150 Z" fill="url(#vgrad-ink)" />
      {/* creator 95% */}
      <path d="M 136 50 A 4 4 0 0 1 144 50 L 100 150 Z" fill="url(#vgrad-creator)" />
      {/* pages */}
      <path d="M 130.5 47 A 1.5 1.5 0 0 1 133.5 47 L 100 150 Z" fill="#8B5CF6" opacity="0.65" />
      <path d="M 123 44 A 1 1 0 0 1 125 44 L 100 150 Z" fill="#8B5CF6" opacity="0.38" />
    </svg>);

}

function SmallV({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <path d="M 53 68 A 7 7 0 0 1 67 68 L 100 150 Z" fill="#A78BFA" />
      <path d="M 136 50 A 4 4 0 0 1 144 50 L 100 150 Z" fill="#8B5CF6" />
    </svg>);

}

function Chrome({ num, total = 10 }) {
  return (
    <div className="chrome">
      <div className="brand">
        <span className="dot"></span>
        <span>Veloran</span>
      </div>
      <div className="num">{String(num).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
    </div>);

}

// --- Slide 1: Cover ---
function SlideCover() {
  return (
    <section className="slide cover" data-screen-label="01 Cover">
      <div className="vmark">
        <VMark />
      </div>
      <h1 className="wordmark">Veloran<span style={{ color: '#8B5CF6' }}>.</span></h1>
      <p className="tagline">The payment & access layer for the agent economy.</p>
      <p className="subtag">
        Sell APIs, datasets, and premium content that humans and AI agents<br />
        unlock with USDC on Solana. 95% direct to sellers, settled on-chain.
      </p>
      <div className="cover-foot">
        <div className="links">
          <span className="live">veloran.app  ·  live on Solana devnet</span>
          <span>github.com/astachain/veloran  ·  open source</span>
          <span style={{ marginTop: 8, color: '#6B6580' }}>Solana Frontier Hackathon · May 2026</span>
        </div>
        <div className="built">
          <span style={{ color: '#6B6580' }}>Built on</span>
          <span style={{ color: '#A78BFA' }}>◎ Solana</span>
        </div>
      </div>
    </section>);

}

// --- Slide 2: Problem ---
function SlideProblem() {
  return (
    <section className="slide" data-screen-label="02 Problem">
      <Chrome num={2} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">The Problem</span>
        <h1 className="headline">Premium digital resources<br />are still sold like <em>2015</em>.</h1>
      </div>
      <div className="three-col">
        <div className="pain-card">
          <div className="pain-title">APIs & SaaS</div>
          <ul>
            <li>API keys + monthly seats, built for <b>humans</b>, not agents</li>
            <li>Stripe minimums kill <b>$0.05</b> per-call pricing</li>
            <li>KYC + custody + clearing every seller hits</li>
          </ul>
        </div>
        <div className="pain-card">
          <div className="pain-title">Datasets & content</div>
          <ul>
            <li>Marketplaces take <b>10%+</b> and own the customer</li>
            <li>No per-call, per-download, or per-row pricing</li>
            <li>Sellers get scraped by agents, never paid</li>
          </ul>
        </div>
        <div className="pain-card">
          <div className="pain-title">AI agents</div>
          <ul>
            <li>Read APIs and content all day, <b>pay nothing</b></li>
            <li>No protocol for autonomous payment</li>
            <li>x402 shipped — settlement layer didn't</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 56 }}>
        <div className="violet-band">Two payers. One missing rail.</div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>);

}

// --- Slide 3: Solution ---
function SolutionFlow() {
  return (
    <div className="flow-diagram">
      <div style={{ fontSize: 14, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 20 }}>
        ──── one URL · two payers ────
      </div>
      {/* Seller */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid #8B5CF6', borderRadius: 10, padding: '10px 24px', color: '#A78BFA', fontSize: 17, whiteSpace: 'nowrap' }}>
          Seller publishes&nbsp;API&nbsp;·&nbsp;dataset&nbsp;·&nbsp;post
        </div>
      </div>
      <div style={{ textAlign: 'center', color: 'var(--text-mute)', fontSize: 20, margin: '4px 0' }}>↓</div>
      {/* slug */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--hairline-strong)', borderRadius: 10, padding: '10px 24px', color: 'var(--text)', fontSize: 17 }}>
          /p/&lt;slug&gt;
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, color: 'var(--text-mute)', fontSize: 20, textAlign: 'center', margin: '0 0 8px 0' }}>
        <span>↙</span>
        <span>↘</span>
      </div>
      {/* Two payers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '12px 14px', textAlign: 'center', fontSize: 15 }}>
          <div style={{ color: 'var(--text)' }}>Human buyer</div>
          <div style={{ color: 'var(--text-mute)', fontSize: 13, marginTop: 4 }}>Privy / Phantom</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '12px 14px', textAlign: 'center', fontSize: 15 }}>
          <div style={{ color: 'var(--text)' }}>AI agent</div>
          <div style={{ color: 'var(--text-mute)', fontSize: 13, marginTop: 4 }}>HTTP 402 · X-PAYMENT</div>
        </div>
      </div>
      {/* Merge */}
      <div style={{ textAlign: 'center', color: 'var(--text-mute)', fontSize: 20, margin: '0 0 6px 0' }}>↘ ↙</div>
      <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid #8B5CF6', borderRadius: 10, padding: '12px 18px', textAlign: 'center', color: '#A78BFA', fontSize: 17, marginBottom: 12, whiteSpace: 'nowrap' }}>
        Anchor program · pay_for_content()
      </div>
      <div style={{ textAlign: 'center', color: 'var(--text-mute)', fontSize: 20, margin: '0 0 8px 0' }}>↓</div>
      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
        <div style={{ width: '95%', background: '#8B5CF6', padding: '12px', textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: 15 }}>95% Seller</div>
        <div style={{ width: '5%', background: 'rgba(139,92,246,0.2)', padding: '12px', textAlign: 'center', color: '#A78BFA', fontWeight: 500, fontSize: 12 }}>5%</div>
      </div>
    </div>);

}

function SlideSolution() {
  return (
    <section className="slide" data-screen-label="03 Solution">
      <Chrome num={3} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">The Solution</span>
        <h1 className="headline">One paywall link. <br /><em>Two payers.</em></h1>
      </div>
      <div className="solution-body">
        <div className="solution-text">
          Sellers publish an API, dataset, or post — set a price <strong>$0.05–$5 USDC</strong> or monthly tier, get one link.
          <br /><br />
          Buyers — human <em>or</em> AI agent — pay in USDC and unlock instantly via the same URL.
          <br /><br />
          <span className="pct">95%</span> to the seller. <span className="pct">5%</span> to Veloran. Split on-chain via our Anchor program.
          <div className="stat-list">
            <span>No custody</span>
            <span>No KYC</span>
            <span>No platform lock-in</span>
          </div>
        </div>
        <SolutionFlow />
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>);

}

window.SlideCover = SlideCover;
window.SlideProblem = SlideProblem;
window.SlideSolution = SlideSolution;
window.Chrome = Chrome;
window.VMark = VMark;
window.SmallV = SmallV;