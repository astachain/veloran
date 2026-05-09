#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-}}}"

if [ -z "${DB_URL}" ]; then
  echo "Set DATABASE_URL, DATABASE_URL_UNPOOLED, or POSTGRES_URL_NON_POOLING before running" >&2
  exit 1
fi

npx prisma migrate diff \
  --from-url "${DB_URL}" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
