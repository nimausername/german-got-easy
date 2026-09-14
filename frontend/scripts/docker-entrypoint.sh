#!/bin/sh
set -eu

if [ -f server.js ]; then
  exec node server.js
fi

if [ -f frontend/server.js ]; then
  exec node frontend/server.js
fi

echo "[entrypoint] Next.js standalone server.js not found" >&2
exit 1
