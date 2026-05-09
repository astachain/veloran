# Phase 4 Devnet Verification — 2026-05-09

## Scope

Task 7 validates the devnet payment flow after Phase 4 hardening.

Production alias tested:

- https://veloran-paywall-sage.vercel.app

Repo anchor at the time this run doc was created:

- Repo: https://github.com/astachain/veloran
- Branch: main
- Commit after malformed-signature fix: `927f4370672359ffd2dceeb988655e85af8845b1`

## Deployment

A production deploy was run before verification because the alias initially returned 404 for `/api/health`, meaning the Phase 4 routes were not yet live on the alias.

Latest production deployment after the malformed-signature fix:

- Deployment URL: https://veloran-paywall-am1atz7da-astachain.vercel.app
- Alias: https://veloran-paywall-sage.vercel.app

## Test post

- Slug: `phase4-human-verify-2026-05-09`
- URL: https://veloran-paywall-sage.vercel.app/p/phase4-human-verify-2026-05-09
- Price: `100000` micro-USDC (`$0.10`)
- Creator address: `HztfmS2VsR5r6n9huqtBMhFVS6JAA1zz23aUN1xCb4YD`
- Content:

```json
{"ok":true,"run":"phase4-human-verify-2026-05-09","note":"Human browser devnet verification content revealed."}
```

## Browser smoke

Opened the post URL in the browser. The page rendered correctly with:

- Title: `Phase 4 Human Verify 2026-05-09`
- Paywall CTA: `Sign in to unlock for $0.10`
- Subscription CTA: `…or subscribe to dr.adityasaputra for $1.00/month`

Clicking unlock opened the Privy modal. The agent browser does not have the user's email OTP or browser wallet, so the final human wallet signing step is still pending user/manual confirmation.

Pending human-only checks:

- Privy email/wallet login as a real reader.
- Wallet transaction modal shows SPL transferChecked + memo instruction.
- Content reveals after the browser wallet payment.

## Health endpoint

```json
{"app":"ok","db":"ok","rpc":"ok","network":"devnet"}
```

## Agent E2E against the same slug

Command:

```bash
set -a; . ./.env.local; set +a
VELORAN_BASE_URL=https://veloran-paywall-sage.vercel.app \
AGENT_KEYPAIR_PATH=/root/.config/solana/agent.json \
NEXT_PUBLIC_SOLANA_RPC_URL="$NEXT_PUBLIC_HELIUS_RPC_URL" \
npm run ai-reader -- phase4-human-verify-2026-05-09
```

Result: success.

Full receipt tx:

- `2uVDHxqUfDo6UJUc7R1MLux3psJ85UtWZ3p3VZMuzVAapF95beNarQiJXZ4ZweQeC6LWDTZQtdyQiiaH7p3VDggR`

Solscan:

- https://solscan.io/tx/2uVDHxqUfDo6UJUc7R1MLux3psJ85UtWZ3p3VZMuzVAapF95beNarQiJXZ4ZweQeC6LWDTZQtdyQiiaH7p3VDggR?cluster=devnet

Output snippet:

```text
💸  Challenge:       $0.10 USDC → 95% creator, 5% platform
📜  Program:         2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS
✅  Confirmed:       2uVDHxqUfDo6UJUc…
🔍  Solscan:         https://solscan.io/tx/2uVDHxqUfDo6UJUc7R1MLux3psJ85UtWZ3p3VZMuzVAapF95beNarQiJXZ4ZweQeC6LWDTZQtdyQiiaH7p3VDggR?cluster=devnet

━━━ Unlocked content ━━━

Phase 4 Human Verify 2026-05-09

{"ok":true,"run":"phase4-human-verify-2026-05-09","note":"Human browser devnet verification content revealed."}

━━━ End ━━━

✅  Replay rejected:  {"error":"Payment intent already consumed"}
```

Replay response body:

```json
{"error":"Payment intent already consumed"}
```

## Negative-path checks

### Malformed / non-existent signature lookup

During verification a malformed-looking signature originally caused a production 500 from `connection.getParsedTransaction(...)`. Root cause: route code treated all syntactically long signatures as safe to send to RPC and did not catch RPC decode errors.

Fix shipped in commit:

- `927f4370672359ffd2dceeb988655e85af8845b1` — `fix: handle malformed payment signature lookups`

Post-fix response:

```text
HTTP/2 400
{"error":"Transaction not found"}
```

Corresponding log event:

```json
{"event":"payment_tx_lookup_failed","ts":"2026-05-09T02:16:59.872Z","intentId":"cmoxpqz6c0001js04a9yatqfi","signaturePrefix6":"111111","network":"solana-devnet","errorCode":"tx_not_found"}
```

### Wrong memo verification failure

Submitted a valid devnet memo-only transaction against a fresh payment intent to verify server-side memo binding rejects it.

Wrong-memo tx:

- `2iQKJoMRY99Z9RbHCB6mrRGno3ayHEHWnJ96ykBVRmKBgv3io1vEJo4r8ZqvjdLiNMsJMSFLvuCgwaDobW3zNtxL`

Response:

```text
HTTP/2 400
{"error":"Transaction memo does not match payment intent"}
```

Corresponding log event:

```json
{"event":"payment_verification_failed","ts":"2026-05-09T02:19:04.764Z","intentId":"cmoxptnrd0005jv04o3v9tkrl","reason":"Transaction memo does not match payment intent","network":"solana-devnet"}
```

## Structured log samples

Vercel logs showed these payment events:

```json
{"event":"payment_challenge_created","ts":"2026-05-09T02:19:04.206Z","intentId":"cmoxptnrd0005jv04o3v9tkrl","slug":"phase4-human-verify-2026-05-09","network":"solana-devnet","expectedAmount":100000}
{"event":"payment_tx_lookup_failed","ts":"2026-05-09T02:16:59.872Z","intentId":"cmoxpqz6c0001js04a9yatqfi","signaturePrefix6":"111111","network":"solana-devnet","errorCode":"tx_not_found"}
{"event":"payment_verification_failed","ts":"2026-05-09T02:19:04.764Z","intentId":"cmoxptnrd0005jv04o3v9tkrl","reason":"Transaction memo does not match payment intent","network":"solana-devnet"}
{"event":"payment_replay_rejected","ts":"2026-05-09T02:17:17.918Z","intentId":"cmoxprbc50003js04k2n2pdw8","signaturePrefix6":"2uVDHx","network":"solana-devnet"}
```

Note: the successful receipt exists in the production DB, and the agent E2E returned unlocked content, but the sampled Vercel log window did not include a `payment_accepted` line for the latest receipt. Treat that as an observability follow-up if repeated.

## Local checks after the malformed-signature fix

```text
npm run test                         ✅
npm run lint                         ✅
npx tsc --noEmit                     ✅
npm run build                        ✅
```

`npm run test:payment-verification` now includes 23 cases, including:

- `parsed transaction fetched when RPC succeeds`
- `malformed signature RPC errors become tx lookup misses`

## Status

Automated/API devnet verification passed.

Human browser wallet signing remains pending because the agent browser cannot complete Privy OTP / wallet approval without the user.
