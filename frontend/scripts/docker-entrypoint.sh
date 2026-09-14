#!/bin/sh
set -eu

mkdir -p public
node -e '
const fs = require("fs");
const url = String(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
fs.writeFileSync("public/env.js", "window.__GGE_API_URL__=" + JSON.stringify(url) + ";\n");
'

if [ -f server.js ]; then
  exec node server.js
fi

if [ -f frontend/server.js ]; then
  exec node frontend/server.js
fi

echo "[entrypoint] Next.js standalone server.js not found" >&2
exit 1
