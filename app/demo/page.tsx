import Link from "next/link";
import type { Metadata } from "next";
import { solscanAccountUrl } from "@/lib/network";
import { CURRENT_NETWORK, VELORAN_PROGRAM_ID } from "@/lib/solana";

export const metadata: Metadata = {
  title: "Demo · Veloran",
  description:
    "Live hackathon demo walkthrough — what to look for, what's happening on-chain, why it matters.",
};

export default function DemoPage() {
  return (
    <main className="flex-1 px-6 py-16 max-w-3xl mx-auto w-full">
      <Link
        href="/"
        className="group inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-violet-400 hover:text-violet-300 transition-colors"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        Veloran
      </Link>

      <header className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">
          Demo · Solana Frontier 2026
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold leading-tight">
          Veloran in 2 minutes.
        </h1>
        <p className="mt-4 text-lg text-neutral-300 leading-relaxed">
          The payment and access layer for the agent economy. Sellers publish
          paid APIs, datasets, or premium content. Humans and AI agents
          unlock with USDC on Solana — settled on-chain, 95% direct to the
          seller, no facilitator.
        </p>
      </header>

      <Section title="The problem">
        <ul className="space-y-2">
          <Bullet>
            Premium digital resources still sell through Stripe, API keys, or
            forced subscriptions — billing systems built for human checkout.
          </Bullet>
          <Bullet>
            AI agents read content and call APIs all day. Existing rails
            give them no native way to discover a price and pay autonomously.
          </Bullet>
          <Bullet>
            Existing crypto-native attempts (xpay.sh, payai.network) are
            off-chain facilitators that hold the buyer&apos;s funds and take
            a fee. There&apos;s no on-chain split.
          </Bullet>
        </ul>
      </Section>

      <Section title="The solution">
        <ul className="space-y-2">
          <Bullet>
            <strong>One paid endpoint, two payers.</strong> The same URL
            serves a checkout to humans and an x402 challenge to agents.
          </Bullet>
          <Bullet>
            <strong>On-chain settlement.</strong> A custom Anchor program
            (<code className="text-xs">{VELORAN_PROGRAM_ID.toBase58().slice(0,4)}…{VELORAN_PROGRAM_ID.toBase58().slice(-4)}</code>) splits 95/5 in
            one atomic transaction. Veloran never custodies funds.
          </Bullet>
          <Bullet>
            <strong>Per-call or subscription.</strong> Heavy buyers pay flat;
            casual buyers pay per request.
          </Bullet>
        </ul>
      </Section>

      <Section title="Demo flow (2:30 video)">
        <div className="mt-4 space-y-4">
          <DemoStep n={1} title="Seller publishes" desc="A paid endpoint at /post/new — title, content (JSON or markdown), price." />
          <DemoStep n={2} title="Human buyer" desc="Opens the URL, signs in via Privy (email or Phantom), pays with one click. Content unlocks." />
          <DemoStep n={3} title="Wallet cutaway" desc="Connect Phantom directly for crypto-native buyers (5 seconds)." />
          <DemoStep n={4} title="AI agent" desc="Hits the same URL via /api/x402/<slug>, receives HTTP 402 with on-chain instructions, signs, re-requests with X-PAYMENT header, parses the JSON response." />
          <DemoStep n={5} title="Seller dashboard" desc="Reflects both unlocks — one human, one agent — with Solscan links to the on-chain transactions." />
          <DemoStep n={6} title="Subscription" desc="Heavy buyer subscribes monthly, unlocks every endpoint from this seller without per-call payments." />
          <DemoStep n={7} title="Solscan proof" desc="The program account view shows every settlement, the 95/5 split visible in token balance changes." />
        </div>
      </Section>

      <Section title="What's happening on-chain">
        <p>
          Every payment — human or agent, per-call or subscription — fires a
          single instruction:
        </p>
        <div className="mt-4 rounded-xl border border-violet-500/20 bg-neutral-950/80 p-6 text-center overflow-hidden relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_60%)]" />
          <div className="relative font-mono text-sm text-neutral-300 space-y-1">
            <p className="text-neutral-500 text-xs">Buyer USDC ATA</p>
            <p className="text-violet-400">↓</p>
            <div className="inline-block rounded-lg border border-violet-500/30 bg-violet-950/20 px-4 py-2">
              <p className="text-violet-200 font-medium">pay_for_content(amount)</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">← 100 lines of Rust</p>
            </div>
            <p className="text-violet-400">↓</p>
            <div className="flex items-center justify-center gap-0">
              <div className="rounded-l-lg border border-r-0 border-emerald-500/30 bg-emerald-950/20 px-4 py-2">
                <p className="text-emerald-300 font-semibold">95%</p>
                <p className="text-[10px] text-neutral-500">Seller</p>
              </div>
              <div className="rounded-r-lg border border-l-0 border-violet-500/30 bg-violet-950/20 px-4 py-2">
                <p className="text-violet-300 font-semibold">5%</p>
                <p className="text-[10px] text-neutral-500">Treasury</p>
              </div>
            </div>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          <Bullet>
            One atomic SPL transaction. Two <code>transfer_checked</code> CPIs
            — buyer → seller (95%) and buyer → treasury (5%).
          </Bullet>
          <Bullet>
            The split ratio is enforced in Rust (<code>PLATFORM_BPS = 500</code>).
            We literally cannot take more than 5%.
          </Bullet>
          <Bullet>
            Single-use payments: each successful <code>pay_for_content</code>{" "}
            consumes exactly one <code>PaymentIntent</code>. Replay returns HTTP
            409. Unique <code>PaymentReceipt.txSignature</code> adds a second
            guard at the database layer.
          </Bullet>
        </ul>
      </Section>

      <Section title="Why this matters for AI agents">
        <ul className="space-y-2">
          <Bullet>
            Agents are real economic actors. They consume APIs, read content,
            call models. None of them have a native payment layer.
          </Bullet>
          <Bullet>
            Subscriptions and API keys assume a long-lived enterprise
            relationship. Agents are episodic — they pay for one request and
            move on.
          </Bullet>
          <Bullet>
            x402 (HTTP 402 Payment Required) shipped as a real protocol in
            2025. Veloran is the on-chain settlement layer underneath it on
            Solana.
          </Bullet>
        </ul>
      </Section>

      <Section title="Why Solana">
        <ul className="space-y-2">
          <Bullet>
            <strong>Sub-cent fees.</strong> $0.05 per-call pricing only works
            if the fee floor is much lower than the price.
          </Bullet>
          <Bullet>
            <strong>Sub-second confirmations.</strong> Agent gets its
            response in the same request cycle.
          </Bullet>
          <Bullet>
            <strong>Custom programs.</strong> Atomic 95/5 split is impossible
            on chains where every payment goes through a hosted facilitator.
          </Bullet>
          <Bullet>
            <strong>USDC liquidity &gt; $5B on Solana.</strong> Real
            stablecoin depth for both sides of the marketplace.
          </Bullet>
        </ul>
      </Section>

      <Section title="The takeaway">
        <p className="text-lg">
          Humans pay with one tap. AI agents pay autonomously. 95% to the
          seller, settled atomically by an on-chain program. Subscriptions
          for heavy buyers. Same primitive, three use cases — paid APIs,
          paid datasets, premium content.
        </p>
        <p className="mt-3 text-neutral-400">
          The agent economy doesn&apos;t need another facilitator. It needs a
          settlement layer. That&apos;s Veloran.
        </p>
      </Section>

      <Section title="Try it yourself">
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
            <span>
              Live URL:{" "}
              <Link
                href="/"
                className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
              >
                veloran-paywall-sage.vercel.app
              </Link>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
            <span>
              Read the agent docs:{" "}
              <Link
                href="/for-agents"
                className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
              >
                /for-agents
              </Link>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
            <span>
              Source on GitHub:{" "}
              <a
                href="https://github.com/astachain/veloran"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
              >
                astachain/veloran
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
            <span>
              Anchor program ({CURRENT_NETWORK}):{" "}
              <a
                href={solscanAccountUrl(VELORAN_PROGRAM_ID.toBase58())}
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
              >
                {VELORAN_PROGRAM_ID.toBase58().slice(0,4)}…{VELORAN_PROGRAM_ID.toBase58().slice(-4)} on Solscan
              </a>
            </span>
          </li>
        </ul>
      </Section>

      <div className="mt-12 flex items-center justify-between gap-4 border-t border-neutral-800 pt-6">
        <Link
          href="/"
          className="group text-sm text-neutral-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to landing
        </Link>
        <Link
          href="/for-agents"
          className="group text-sm text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
        >
          Agent docs
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-neutral-100">{title}</h2>
      <div className="mt-3 text-neutral-300 leading-relaxed">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
      <span>{children}</span>
    </li>
  );
}

function DemoStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="shrink-0 flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border border-violet-700/40 bg-violet-950/30 text-violet-300 flex items-center justify-center text-sm font-medium">
          {n}
        </div>
        {n < 7 && <div className="w-px h-full min-h-[20px] bg-neutral-800 mt-1" />}
      </div>
      <div className="pb-4">
        <p className="font-medium text-neutral-200">{title}</p>
        <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
