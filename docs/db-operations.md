# Database Operations

Veloran uses Prisma migrations against Postgres/Neon. Production was initially created with `prisma db push` plus a one-off SQL bridge for payment intents; migration history is now anchored with:

- `000001_baseline` — current production schema before subscription payment intents.
- `000002_subscription_payment_intents` — adds memo-bound subscription payment intents.

## Rules

- Never commit files under `backups/`.
- Prefer the unpooled Neon URL for schema operations and backups.
- Do not run `prisma db push` against production except as a documented emergency fallback.
- Run drift checks before and after any production migration.
- If `pg_dump` is older than the Neon server version, stop and install/use a matching client before relying on `pg_dump` output. A `psql` CSV export can help, but it is not a full replacement for `pg_dump`.

## Fresh backup

Use a PostgreSQL client version matching or newer than the server:

```bash
mkdir -p backups
chmod 700 backups

DB_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL}}}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

pg_dump --schema-only "$DB_URL" > "backups/prod-schema-${stamp}.sql"
pg_dump "$DB_URL" > "backups/prod-full-${stamp}.sql"
chmod 600 backups/prod-*"${stamp}"*.sql
```

If a matching `pg_dump` is unavailable, capture a temporary logical sanity backup with `psql` before making changes:

```bash
mkdir -p backups/prod-logical-${stamp}
psql "$DB_URL" -Atc "select tablename from pg_tables where schemaname='public' order by tablename" > backups/prod-logical-${stamp}/tables.txt
while read -r t; do
  psql "$DB_URL" -c "\\copy \"$t\" to '$PWD/backups/prod-logical-${stamp}/$t.csv' with csv header"
done < backups/prod-logical-${stamp}/tables.txt
```

## Drift check

```bash
DATABASE_URL=... ./scripts/check-prisma-drift.sh
```

Expected clean output is either empty or `-- This is an empty migration.`

## Migration status

```bash
DATABASE_URL=... npx prisma migrate status
```

## Apply pending migrations

```bash
DATABASE_URL=... npx prisma migrate deploy
```

## Baseline an existing production DB

Only do this after a fresh backup and drift review:

```bash
DATABASE_URL=... npx prisma migrate resolve --applied 000001_baseline
DATABASE_URL=... npx prisma migrate deploy
DATABASE_URL=... npx prisma migrate status
```

`resolve --applied` marks the baseline as already present. It must not be used for migrations that have not actually been applied.

## Restore from backup

Plain SQL dump:

```bash
psql "$DATABASE_URL" < backups/prod-full-YYYYMMDDTHHMMSSZ.sql
```

Custom-format dump, if used:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" backups/prod-full-YYYYMMDDTHHMMSSZ.dump
```
