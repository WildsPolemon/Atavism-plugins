#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/server"
export RUST_PORT="${RUST_PORT:-7777}"
export RUST_SEED="${RUST_SEED:-1337}"
npm start
