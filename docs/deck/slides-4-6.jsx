/* global React */
const { useState: useState4, useEffect: useEffect4, useRef: useRef4 } = React;

// --- Slide 4: Human pays ---
function SlideHuman() {
  return (
    <section className="slide" data-screen-label="04 Human Pays">
      <window.Chrome num={4} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">Flow · Human</span>
        <h1 className="headline">Email login. No seed phrase.<br /><em>One click to unlock.</em></h1>
        <p style={{ fontFamily: 'GeistMono, monospace', fontSize: 22, color: 'var(--text-mute)', margin: '24px 0 0 0', letterSpacing: '0.06em' }}>
          Privy email login  ·  Phantom wallet  ·  Devnet USDC  ·  ~3 seconds end-to-end
        </p>
      </div>
      <div className="storyboard">
        {/* Frame 1: paywall */}
        <div className="frame">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="frame-num">01 / VISIT</span>
            <span style={{ fontFamily: 'GeistMono, monospace', fontSize: 12, color: 'var(--text-mute)' }}>/p/q3-essay</span>
          </div>
          <h3 className="frame-title">Gated resource</h3>
          <div className="frame-canvas">
            <div className="minipay">
              <div className="url-bar">veloran.app/p/q3-essay</div>
              <p className="post-title">The agent economy is here</p>
              <div style={{ fontFamily: 'GeistMono, monospace', fontSize: 11, color: 'var(--text-mute)', marginBottom: 12 }}>by @nikola · 8 min read</div>
              <div className="blurred">
                <div className="lines">
                  <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
                </div>
              </div>
              <div className="unlock-btn">Unlock for $0.50 USDC</div>
            </div>
          </div>
        </div>
        {/* Frame 2: privy */}
        <div className="frame">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="frame-num">02 / APPROVE</span>
            <span style={{ fontFamily: 'GeistMono, monospace', fontSize: 12, color: 'var(--text-mute)' }}>privy modal</span>
          </div>
          <h3 className="frame-title">Confirm payment</h3>
          <div className="frame-canvas" style={{ background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="privy-modal" style={{ width: '100%', maxWidth: 320 }}>
              <div className="ph">PRIVY · embedded wallet</div>
              <h4>Send 0.50 USDC</h4>
              <div className="row"><span className="k">Method</span><span className="v">SPL transferChecked</span></div>
              <div className="row"><span className="k">Amount</span><span className="v usdc">0.50 USDC</span></div>
              <div className="row"><span className="k">To</span><span className="v">3P6V…VmYB</span></div>
              <div className="row"><span className="k">Network</span><span className="v">Solana devnet</span></div>
              <div className="row"><span className="k">Fee</span><span className="v">~0.000005 SOL</span></div>
              <div className="approve">Approve</div>
            </div>
          </div>
        </div>
        {/* Frame 3: unlocked */}
        <div className="frame">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="frame-num">03 / UNLOCKED</span>
            <span style={{ fontFamily: 'GeistMono, monospace', fontSize: 12, color: '#7DD3FC' }}>~3s end-to-end</span>
          </div>
          <h3 className="frame-title">Read + receipt</h3>
          <div className="frame-canvas">
            <div className="unlocked">
              <div className="check">✓</div>
              <p className="post-title">The agent economy is here</p>
              <div style={{ fontFamily: 'GeistMono, monospace', fontSize: 11, color: 'var(--text-mute)', marginBottom: 8 }}>by @nikola · 8 min read</div>
              <div className="text-line"></div>
              <div className="text-line"></div>
              <div className="text-line short"></div>
              <div className="text-line"></div>
              <div className="text-line"></div>
              <div className="text-line short"></div>
              <div className="text-line"></div>
              <div className="solscan">
                <span>↗</span>
                <span>solscan.io/tx/56upSAXh…q5u</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>
  );
}

// --- Slide 5: Agent pays — animated terminal ---
const TERM_FRAMES = [
  { delay: 0, line: { icn: '🤖', icnClass: 'violet', text: <><span className="txt dim">Agent address: </span><span className="hash">3P6V…VmYB</span></> } },
  { delay: 600, line: { icn: '📡', icnClass: 'violet', text: <><span className="txt">Hitting endpoint without payment…</span></> } },
  { delay: 700, line: { icn: '⚠', icnClass: 'live', text: <><span className="txt dim">HTTP </span><span className="txt" style={{ color: '#FCA5A5' }}>402 Payment Required</span><span className="txt dim"> · scheme=</span><span className="hash">exact-veloran</span></> } },
  { delay: 600, line: { icn: '💸', icnClass: 'violet', text: <><span className="txt dim">Challenge: </span><span className="txt">$0.50 USDC</span><span className="txt dim"> → </span><span className="txt">95% seller</span><span className="txt dim">, </span><span className="txt">5% platform</span></> } },
  { delay: 500, line: { icn: '🧾', icnClass: 'violet', text: <><span className="txt dim">Memo: </span><span className="hash">veloran:intent:7f9a…</span><span className="txt dim"> (15-min TTL)</span></> } },
  { delay: 500, line: { icn: '🔨', icnClass: 'violet', text: <><span className="txt">Building </span><span className="hash">pay_for_content</span><span className="txt"> transaction…</span></> } },
  { delay: 800, line: { icn: '📝', icnClass: 'violet', text: <><span className="txt dim">Signing with agent keypair…</span></> } },
  { delay: 700, line: { icn: '✅', icnClass: 'green', text: <><span className="txt dim">Confirmed: </span><span className="hash">56upSAXh…q5u</span></> } },
  { delay: 500, line: { icn: '🔓', icnClass: 'green', text: <><span className="txt">Re-requesting with </span><span className="hash">X-PAYMENT</span><span className="txt"> header…</span></> } },
  { delay: 700, line: { icn: '✓', icnClass: 'green', text: <><span className="txt dim">HTTP </span><span className="txt" style={{ color: '#86EFAC' }}>200 OK</span></> } },
  { delay: 400, divider: '━━━ Unlocked content ━━━' },
  { delay: 300, line: { icn: '', icnClass: '', text: <><span className="txt dim">"The agent economy is here. Three years ago…"</span></> } },
  { delay: 600, line: { icn: '', icnClass: '', text: <><span className="txt dim">"…creators get scraped, not paid. Until now."</span></> } },
];

function AgentTerminal() {
  const [shown, setShown] = useState4(0);
  const [tick, setTick] = useState4(0);
  const ref = useRef4();

  useEffect4(() => {
    let mounted = true;
    let timers = [];

    function play() {
      setShown(0);
      let acc = 400;
      TERM_FRAMES.forEach((f, i) => {
        acc += f.delay;
        const t = setTimeout(() => mounted && setShown(s => Math.max(s, i + 1)), acc);
        timers.push(t);
      });
      // restart loop
      const t2 = setTimeout(() => mounted && setTick(x => x + 1), acc + 4000);
      timers.push(t2);
    }
    play();
    return () => { mounted = false; timers.forEach(clearTimeout); };
  }, [tick]);

  return (
    <div className="term-pane" ref={ref}>
      <div className="pane-head">
        <div className="dots"><span></span><span></span><span></span></div>
        <span className="title">~/veloran-agent · ai-reader.ts</span>
      </div>
      <div className="pane-body">
        <div className="term-line">
          <span className="icn"></span>
          <span className="txt dim">$ </span>
          <span className="txt">tsx ai-reader.ts</span>
        </div>
        {TERM_FRAMES.slice(0, shown).map((f, i) => (
          f.divider ? (
            <div key={i} className="term-divider">{f.divider}</div>
          ) : (
            <div key={i} className="term-line">
              <span className={`icn ${f.line.icnClass}`}>{f.line.icn}</span>
              <span>{f.line.text}</span>
            </div>
          )
        ))}
        {shown < TERM_FRAMES.length && (
          <div className="term-line">
            <span className="icn"></span>
            <span className="term-cursor"></span>
          </div>
        )}
      </div>
    </div>
  );
}

function SlideAgent() {
  return (
    <section className="slide" data-screen-label="05 Agent Pays">
      <window.Chrome num={5} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">Flow · Agent · The Novel Moment</span>
        <h1 className="headline" style={{ fontSize: 88 }}>Every paid URL<br />is also an <em>x402 endpoint</em>.</h1>
      </div>
      <div className="agent-body">
        <div className="code-pane">
          <div className="pane-head">
            <div className="dots"><span></span><span></span><span></span></div>
            <span className="title">agent.ts · ~6 lines</span>
          </div>
          <div className="pane-body code">
            <div><span className="kw">const</span> res = <span className="kw">await</span> <span className="fn">fetch</span>(url);</div>
            <div><span className="kw">if</span> (res.status === <span className="str">402</span>) {'{'}</div>
            <div>{'  '}<span className="kw">const</span> {'{'} accepts {'}'} = <span className="kw">await</span> res.<span className="fn">json</span>();</div>
            <div>{'  '}<span className="kw">const</span> tx = <span className="kw">await</span> <span className="fn">pay</span>(accepts[<span className="str">0</span>]);</div>
            <div>{'  '}<span className="com">// pay_for_content w/ 95/5 split</span></div>
            <div>{'  '}<span className="kw">const</span> paid = <span className="kw">await</span> <span className="fn">fetch</span>(url, {'{'}</div>
            <div>{'    '}headers: {'{'} <span className="str">"X-PAYMENT"</span>: <span className="fn">encode</span>(tx) {'}'},</div>
            <div>{'  '}{'}'});</div>
            <div>{'  '}<span className="fn">console.log</span>(<span className="kw">await</span> paid.<span className="fn">text</span>());</div>
            <div>{'}'}</div>
          </div>
        </div>
        <AgentTerminal />
      </div>
      <div style={{ marginTop: 28 }}>
        <div className="violet-band">Custom <code style={{ background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: 4 }}>exact-veloran</code> 402 scheme · server-bound PaymentIntent · replay-safe via Solana memo</div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>
  );
}

// --- Slide 6: On-chain split ---
function LiveCounter() {
  const [val, setVal] = useState4(2847.13);
  useEffect4(() => {
    const id = setInterval(() => {
      setVal(v => +(v + 0.50 + Math.random() * 0.05).toFixed(2));
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="live-counter">
      <span className="live-dot"></span>
      <span>devnet earnings · this minute</span>
      <span className="amt">${val.toFixed(2)} USDC</span>
    </div>
  );
}

function SlideSplit() {
  return (
    <section className="slide" data-screen-label="06 On-chain split">
      <window.Chrome num={6} />
      <div style={{ marginTop: 80 }}>
        <span className="eyebrow">On-chain</span>
        <h1 className="headline">Trustless<br /><em>by construction</em>.</h1>
      </div>
      <div className="split-body">
        <div className="anchor-diagram">
          <div className="ad-step">Reader USDC ATA</div>
          <div className="ad-arrow"></div>
          <div className="ad-instruction">pay_for_content(amount)</div>
          <div style={{ fontSize: 14, color: 'var(--text-mute)', letterSpacing: '0.1em' }}>~100 lines of Rust · Anchor</div>
          <div className="ad-arrow"></div>
          <div style={{ width: '100%' }}>
            <div className="split-bar">
              <div className="creator">95%  ·  Seller</div>
              <div className="treasury">5%</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: 'var(--text-mute)', letterSpacing: '0.08em' }}>
              <span>seller wallet</span>
              <span>veloran treasury</span>
            </div>
          </div>
        </div>
        <div className="right-detail">
          <ul className="bullets">
            <li>One atomic transaction. Deterministic 95/5 split. <strong style={{ color: 'var(--text)' }}>No middleman custodies USDC</strong>.</li>
            <li>Devnet program <code>2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS</code> — running the live demo.</li>
            <li>Mainnet program <code>89ZFuq1beQHRHRHWY6yezePsdWvTxtMGrLVDXu8DLa1j</code> — already deployed and smoke-tested on real USDC.</li>
            <li>Same instruction powers per-call unlocks <strong style={{ color: 'var(--text)' }}>and</strong> subscriptions. Generic by design.</li>
          </ul>
          <LiveCounter />
        </div>
      </div>
      <div className="foot">
        <span>VELORAN / 2026</span>
        <span>solana frontier hackathon</span>
      </div>
    </section>
  );
}

window.SlideHuman = SlideHuman;
window.SlideAgent = SlideAgent;
window.SlideSplit = SlideSplit;
