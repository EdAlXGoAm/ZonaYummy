#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/old_zonayummy/build}"

cd "$ROOT"

PM2_APPS_TO_RESTART=()
stop_pm2_dev_servers() {
  command -v pm2 >/dev/null 2>&1 || return 0

  while IFS='|' read -r name cwd status; do
    [ "$cwd" = "$ROOT" ] || continue
    [ "$status" = "online" ] || continue
    PM2_APPS_TO_RESTART+=("$name")
    pm2 stop "$name" >/dev/null
  done < <(
    pm2 jlist 2>/dev/null | node -e '
      const root = process.argv[1];
      for (const app of JSON.parse(require("fs").readFileSync(0, "utf8"))) {
        const env = app.pm2_env || {};
        console.log([app.name, env.pm_cwd || "", env.status || ""].join("|"));
      }
    ' "$ROOT"
  )
}

restart_pm2_dev_servers() {
  if [ "${#PM2_APPS_TO_RESTART[@]}" -gt 0 ]; then
    pm2 restart "${PM2_APPS_TO_RESTART[@]}" >/dev/null || true
  fi
}

stop_pm2_dev_servers
trap restart_pm2_dev_servers EXIT

# react-scripts writes webpack/babel cache here; npm ci can fail if a dev server is running
rm -rf node_modules/.cache
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
