#!/usr/bin/env bash
set -euo pipefail

# Safely applies the Phase 3 PaymentIntent/PaymentReceipt tables to an existing
# Veloran Postgres database.
#
# Usage:
#   set -a; source .env.local; set +a
#   scripts/apply-payment-intents-sql.sh
#
# Requires: pg_dump, psql

DB_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-}}}"
if [[ -z "${DB_URL}" ]]; then
  echo "Missing DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING, or DATABASE_URL" >&2
  exit 1
fi

command -v pg_dump >/dev/null || { echo "pg_dump not found" >&2; exit 1; }
command -v psql >/dev/null || { echo "psql not found" >&2; exit 1; }

mkdir -p backups/db
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="backups/db/veloran-prod-${stamp}.dump"

echo "Backing up database to ${backup}"
pg_dump "${DB_URL}" --format=custom --file "${backup}"
chmod 600 "${backup}"

echo "Applying scripts/sql/20260508_payment_intents.sql"
psql "${DB_URL}" -v ON_ERROR_STOP=1 -f scripts/sql/20260508_payment_intents.sql

echo "Verifying new tables"
psql "${DB_URL}" -v ON_ERROR_STOP=1 -c 'select count(*) as payment_intents from "PaymentIntent"; select count(*) as payment_receipts from "PaymentReceipt";'

echo "Done. Backup: ${backup}"
