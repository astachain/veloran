# Payment Safety

## Guarantees

- **Memo-bound payments.** Every paid request (per-post and subscription) returns a 402 challenge with a server-issued `intentId` and `memo` (format: `veloran:intent:<nonce>`, 16 random hex bytes). The buyer's transaction MUST include that memo as a Memo program instruction (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`). Wrong memo = 400.
- **Single-use.** Each `PaymentIntent` / `SubscriptionPaymentIntent` is consumed on the first successful unlock (`consumedAt` set). Replay returns 409.
- **Unique signatures.** `PaymentReceipt.txSignature` and `Subscription.txSignature` have unique constraints; same signature can never write a second row.
- **TTL.** Intents expire after 15 minutes. Expired intent = 400.
- **Payer binding.** Once an intent has a `payerAddress` / `subscriberAddress`, that's the only address that can settle it.
- **On-chain split.** The Anchor program enforces 95/5 atomically; we verify recipient and platform deltas server-side after the tx confirms.

## Subscription-specific notes

- `SubscriptionPaymentIntent` is creator-scoped (not post-scoped) and carries `plan` ("monthly" | "yearly").
- The SubscribeButton now fetches an intent first (Phase 1), embeds the memo, signs the tx (Phase 2), then settles with the server (Phase 3).
- The same replay protections apply: consumed intent → 409, expired → 400, wrong memo → 400.

## Current limits (devnet)

- USDC only. SOL/EURC are roadmap.
- Per-call and subscription tiers. Subscription replay safety is handled in Phase 4 Task 5.
- Mainnet remains gated until Phase 4 hardening passes.

## What replay actually returns

- Same `intentId`, same `txSignature`: 409 with `{ "error": "Payment signature already consumed" }` (human path) or `{ "error": "Payment intent already consumed" }` (agent path).
- Different `intentId` with stale memo: 400 `Transaction memo does not match payment intent`.
- Expired intent: 400 `Payment intent expired`.
