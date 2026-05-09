# Ops Runbook

## Health check

```bash
curl -s https://veloran-paywall-sage.vercel.app/api/health | jq
```

Expected: `{ "app": "ok", "db": "ok", "rpc": "ok", "network": "devnet" }`

## Payment event log queries

```bash
vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 30m --json | \
  jq -c 'select(.message | test("\"event\":")) | (.message | fromjson)'
```

## By event type

```bash
for ev in payment_challenge_created payment_tx_lookup_failed payment_verification_failed payment_accepted payment_replay_rejected; do
  echo "=== $ev ==="
  vercel logs https://veloran-paywall-sage.vercel.app --no-follow --since 1h --json | \
    jq -c --arg ev "$ev" 'select(.message | test("\"event\":\"" + $ev + "\""))' | head -5
done
```

## Incident checklist

1. **Pause payments** by setting `NEXT_PUBLIC_VELORAN_TREASURY` to a non-existent address (forces 402 challenge to fail; sellers don't take funds).
2. **Roll back deploy** via Vercel dashboard → Deployments → previous → Promote.
3. **Inspect logs** via the queries above.
4. **Verify DB** with `npx prisma migrate status` (see Task 3).
5. **Preserve evidence** — for any tx-related incident, capture the signature, intent ID, and Solscan link before doing anything else.
