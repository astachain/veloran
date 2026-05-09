# Veloran Mainnet Smoke Checklist

> Use this only after the hackathon-critical submission package is safe. Mainnet is real money. Tiny values only.

## Scope

This checklist is for the first real-USDC proof that Veloran’s Anchor payment split works on Solana mainnet.

Recommended hackathon scope:

- Deploy/smoke the Anchor program on mainnet if keypairs + funding are ready.
- Keep the live app and demo video on devnet unless explicitly approved after smoke.

## Known addresses

- Planned mainnet deployer/treasury: `41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL`
- Planned mainnet program: `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`
- Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Devnet program, for comparison only: `2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS`

## Required before starting

- [ ] Mainnet deployer keypair exists on the executing machine.
- [ ] Program keypair exists on the executing machine.
- [ ] Do not paste or print keypair contents.
- [ ] Deployer has enough SOL for deploy.
- [ ] Deployer or smoke buyer has tiny USDC for smoke.
- [ ] Private/mainnet RPC chosen if doing app-level mainnet verification.
- [ ] Latest code is pushed to GitHub.

## Balance checks

```bash
solana balance 41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL --url mainnet-beta
spl-token accounts --owner 41iGsC9mV9FfN9fuua7asQBa5oLLcM13gPCcCnhDvuJL --url mainnet-beta
```

If SOL is insufficient, stop. Submit devnet. Do not miss the hackathon trying to fund wallets at the deadline.

## Program deployment smoke

1. Confirm `anchor/Anchor.toml` has `[programs.mainnet]` for `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`.
2. Confirm `anchor/programs/veloran-paywall/src/lib.rs` compiles with mainnet constants under a `mainnet` feature.
3. Build mainnet binary.
4. Deploy.
5. Verify Solscan mainnet account:
   - `https://solscan.io/account/Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`

## Tiny transaction smoke

Use a deliberately tiny amount, e.g. `50_000` micro-USDC = `$0.05`.

Expected behavior:

- Buyer debited: `0.050000` USDC
- Creator credited: `0.047500` USDC
- Platform credited: `0.002500` USDC
- Program invoked: `Bybn483XkZxahdTQKHqRzfvuAnvPocWti9PGUVoPxhLz`
- Transaction error: `null`

Record:

- Mainnet tx signature:
- Solscan URL:
- Buyer address:
- Creator address:
- Treasury address:
- Amount:
- Result:

## If flipping the app to mainnet

Do not do this unless explicitly approved after program smoke.

Vercel env vars required:

```text
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_VELORAN_PROGRAM_ID=<mainnet deployed program>
NEXT_PUBLIC_VELORAN_TREASURY=<mainnet treasury public key>
SERVER_SOLANA_RPC_URL=<private mainnet RPC>
```

Then verify:

- [ ] `/api/health` reports `network: mainnet-beta` and DB/RPC ok.
- [ ] Human unlock with tiny price succeeds.
- [ ] Agent unlock with tiny price succeeds.
- [ ] Replay rejects.
- [ ] Solscan links omit `?cluster=devnet`.
- [ ] Vercel logs have no payment 500s.

## Rollback

If anything smells wrong:

1. Promote previous Vercel devnet deployment.
2. Restore Vercel env vars to devnet.
3. Keep tx signature and logs.
4. Do not attempt another real-money run until root cause is known.

## Submission-safe wording

If only devnet app is live:

> Veloran is live on devnet for safe judge testing. The payment program is designed for mainnet deployment with explicit mainnet config gates and a tiny-value smoke checklist.

If mainnet program is deployed and smoked:

> Veloran’s app demo runs on devnet for safe judge testing; the same Anchor payment program has also been deployed/smoked on mainnet with tiny USDC to prove production readiness.
