/* global React */
const { useState: useState7 } = React;

// --- Slide 7: Subscriptions ---
function SlideSubs() {
  return (
    <section className="slide" data-screen-label="07 Subscriptions">
      <window.Chrome num={7} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">Two flows · one instruction</span>
        <h1 className="headline">Per-call for agents.<br /><em>Subscriptions for sellers.</em></h1>
      </div>
      <div className="sub-body">
        <div className="sub-card">
          <div className="kicker">Per-call</div>
          <h3>Pay once.<br/>Unlock once.</h3>
          <div className="price"><b>$0.05 – $5 USDC</b> per request</div>
          <ul>
            <li>API call, dataset download, or single post unlock</li>
            <li>95% seller / 5% Veloran — every request</li>
            <li>Receipt: Solscan link forever</li>
          </ul>
        </div>
        <div className="sub-card featured">
          <div className="kicker">Subscription</div>
          <h3>Pay once.<br/>Unlock everything.</h3>
          <div className="price">monthly  ·  yearly</div>
          <ul>
            <li>One payment unlocks every resource from a seller</li>
            <li>Same on-chain instruction, longer duration</li>
            <li>HMAC cookie auto-expires when on-chain <code>expiresAt</code> passes — no off-chain renewal nonsense</li>
            <li>Buyer can upgrade monthly → yearly without losing time</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 40 }}>
        <div className="violet-band">Both flows use the same Anchor instruction. No new on-chain code; off-chain DB tracks plan + duration.</div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>
  );
}

// --- Slide 8: Why now ---
function SlideWhyNow() {
  return (
    <section className="slide" data-screen-label="08 Why Now">
      <window.Chrome num={8} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">Market</span>
        <h1 className="headline">Four trends<br /><em>converging</em>.</h1>
      </div>
      <div className="market-table">
        <div className="market-row">
          <div className="force">Agent economy</div>
          <div className="signal">OpenAI, Anthropic, Google all shipped agents in 2025–26. Web traffic from agents <b>crossed 30%</b> on some sites. None of them pay for what they read.</div>
        </div>
        <div className="market-row">
          <div className="force">x402 protocol</div>
          <div className="signal">HTTP 402 Payment Required <b>shipped as a real protocol in 2025</b>. The wire is ready; the on-chain settlement layer is the missing piece.</div>
        </div>
        <div className="market-row">
          <div className="force">Creator + API economy</div>
          <div className="signal">Substack hit <b>4M+ paid subs</b>. Indie API providers ship daily. Sellers want lower take rates and per-call pricing.</div>
        </div>
        <div className="market-row">
          <div className="force">Solana stablecoins</div>
          <div className="signal">USDC supply on Solana <b>&gt; $5B</b>. Sub-cent transfer fees + sub-second confirmations make <b>$0.05 per call</b> finally economical.</div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <div className="violet-band">Veloran sits exactly where these four trends meet.</div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>
  );
}

// --- Slide 9: Roadmap ---
function SlideRoadmap() {
  return (
    <section className="slide" data-screen-label="09 Roadmap">
      <window.Chrome num={9} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">Roadmap</span>
        <h1 className="headline">Devnet today.<br /><em>Mainnet next.</em></h1>
      </div>
      <div className="roadmap-body">
        <div className="milestone now">
          <div className="when">Today  ·  May 2026</div>
          <h3>This submission</h3>
          <ul>
            <li className="done">Live on Solana devnet at veloran.app</li>
            <li className="done">Per-call + subscription unlocks</li>
            <li className="done">Privy email + Phantom wallet login</li>
            <li className="done">AI agent flow via HTTP 402 + X-PAYMENT</li>
            <li className="done">Anchor 95/5 split — devnet & mainnet</li>
            <li className="done">Mainnet smoke test confirmed on real USDC</li>
          </ul>
        </div>
        <div className="milestone">
          <div className="when">Q3 2026</div>
          <h3>Mainnet cutover</h3>
          <ul>
            <li>Wire live app to mainnet program <code style={{ fontFamily: 'GeistMono, monospace', fontSize: 14, color: 'var(--violet-soft)' }}>89ZFuq…DLa1j</code></li>
            <li>Third-party audit of the Anchor program</li>
            <li>Privy production app + Helius indexer for earnings</li>
            <li>Custom domains for sellers</li>
          </ul>
        </div>
        <div className="milestone">
          <div className="when">Q4 2026</div>
          <h3>Veloran SDK</h3>
          <ul>
            <li>Drop-in 402 + settlement library for any backend</li>
            <li>First-class API, dataset, file paywalls (CSV, JSON, PDF)</li>
            <li>Multi-asset payments (USDC, SOL, EURC)</li>
            <li>Cross-seller bundles for buyers</li>
          </ul>
        </div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>
  );
}

// --- Slide 10: Ask ---
function SlideAsk() {
  return (
    <section className="slide" data-screen-label="10 Ask">
      <window.Chrome num={10} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">The Closer</span>
        <h1 className="headline">Publish once.<br /><em>Get paid directly on-chain.</em></h1>
        <p style={{ fontFamily: 'GeistMono, monospace', fontSize: 26, color: 'var(--text-dim)', margin: '24px 0 0 0', lineHeight: 1.5, maxWidth: 1500 }}>
          Humans pay with checkout. Agents pay with HTTP&nbsp;402. Sellers get 95% directly, settled on-chain.
        </p>
      </div>
      <div className="ask-body">
        <div className="ask-card">
          <div className="num">01</div>
          <h3>Win the prize.</h3>
          <p>The demo runs at veloran.app. The split is on-chain. The agent flow is novel. We earn it.</p>
        </div>
        <div className="ask-card">
          <div className="num">02</div>
          <h3>Solana Foundation grant.</h3>
          <p>Strong fit for the x402 infrastructure track. ~$25–75K to audit the mainnet program, cut over the live app, ship the SDK.</p>
        </div>
        <div className="ask-card">
          <div className="num">03</div>
          <h3>Talk to sellers.</h3>
          <p>Twenty sellers on mainnet by end of Q3 = real product validation. Send us API providers, dataset publishers, indie analysts.</p>
        </div>
      </div>
      <div className="ask-foot">
        <div className="item">
          <div className="label">Live demo</div>
          <div className="val live">veloran.app</div>
        </div>
        <div className="item">
          <div className="label">Open source</div>
          <div className="val violet">github.com/astachain/veloran</div>
        </div>
        <div className="item">
          <div className="label">Email</div>
          <div className="val">takahibepower@gmail.com</div>
        </div>
        <div className="item">
          <div className="label">Solana Frontier</div>
          <div className="val">May 2026</div>
        </div>
      </div>
    </section>
  );
}

window.SlideSubs = SlideSubs;
window.SlideWhyNow = SlideWhyNow;
window.SlideRoadmap = SlideRoadmap;
window.SlideAsk = SlideAsk;
