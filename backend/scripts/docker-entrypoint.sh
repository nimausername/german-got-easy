#!/bin/sh
set -eu

echo "[entrypoint] applying database migrations"
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] prisma migrate deploy failed after retries" >&2
    echo "[entrypoint] if the error mentions prisma engines/permissions, the image is broken; if it mentions P1001/ENOTFOUND, DATABASE_URL cannot reach Postgres" >&2
    exit 1
  fi
  echo "[entrypoint] migrate failed, retrying ($i/30)"
  sleep 2
done

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] seeding lesson and word content"
  npx tsx prisma/seed.ts
fi

if [ "${KEYCLOAK_BOOTSTRAP:-false}" = "true" ]; then
  echo "[entrypoint] ensuring Keycloak realm and backend client"
  node dist/ops/ensure-keycloak.js
fi

echo "[entrypoint] starting API"
exec node dist/index.js
