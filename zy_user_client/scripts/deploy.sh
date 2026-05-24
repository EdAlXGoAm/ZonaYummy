#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/old_zonayummy/build}"

cd "$ROOT"
if [ -f package-lock.json ]; then
  npm ci --include=dev
else
  npm install --include=dev
fi
npm run build

mkdir -p "$WEB_ROOT"
rsync -a --delete "$ROOT/build/" "$WEB_ROOT/"

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "Deployed to $WEB_ROOT"
