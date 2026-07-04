#!/usr/bin/env bash
set -euo pipefail

ROOT="/workspace/atavismeditor-source-v10.13.0.p10/atavismeditor-master"
PROFILE_DIR="$ROOT/tools/screenshot-setup/screenshot-profile"
OUT_DIR="${1:-/workspace/releases/editor_media_2026-07-04}"
DISPLAY="${DISPLAY:-:1}"

cd "$ROOT"
yarn electron:serve-tsc >/dev/null

# Ensure MariaDB is up
if ! mysql -u atavism -patavism -h 127.0.0.1 -e "SELECT 1" >/dev/null 2>&1; then
  sudo mkdir -p /run/mysqld && sudo chown mysql:mysql /run/mysqld
  sudo mariadbd --user=mysql --datadir=/var/lib/mysql --bind-address=127.0.0.1 --port=3306 --socket=/run/mysqld/mysqld.sock &
  sleep 3
  sudo mysql --socket=/run/mysqld/mysqld.sock < "$ROOT/tools/screenshot-setup/minimal_world_content.sql"
fi

mkdir -p "$PROFILE_DIR/Assets"
node "$ROOT/tools/screenshot-setup/create_profile.js"

pkill -f "electron.*atavism" 2>/dev/null || true
sleep 1

DISPLAY="$DISPLAY" npx electron . --serve "projectpath=${PROFILE_DIR}" --remote-debugging-port=9222 &
ELECTRON_PID=$!

for i in $(seq 1 40); do
  if curl -s http://127.0.0.1:9222/json/version >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

sleep 12
node "$ROOT/tools/capture_via_cdp_raw.js" "$OUT_DIR" 9222

kill "$ELECTRON_PID" 2>/dev/null || true
