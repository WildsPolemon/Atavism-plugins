#!/usr/bin/env bash
# Збірка архіву StarNet Core для хостингу
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$ROOT/release/starnet-core"
ARCHIVE="$ROOT/release/starnet-core-hosting.zip"
VERSION=$(date +%Y%m%d)

echo "==> Build admin + cashier"
cd "$ROOT/admin" && npm ci --silent 2>/dev/null || npm install --silent
VITE_BASE=/admin/ npm run build
cd "$ROOT/cashier" && npm ci --silent 2>/dev/null || npm install --silent
VITE_BASE=/cashier/ npm run build

echo "==> Composer production"
cd "$ROOT/backend"
composer install --no-dev --optimize-autoloader --quiet 2>/dev/null || composer install --no-dev --optimize-autoloader

echo "==> Prepare release folder"
rm -rf "$RELEASE_DIR" "$ARCHIVE"
mkdir -p "$RELEASE_DIR"

rsync -a --exclude='node_modules' --exclude='.env' --exclude='writable/database.db' \
  --exclude='writable/logs/*' --exclude='writable/cache/*' --exclude='writable/session/*' \
  "$ROOT/backend/" "$RELEASE_DIR/backend/"

mkdir -p "$RELEASE_DIR/backend/writable/cache" "$RELEASE_DIR/backend/writable/logs" \
  "$RELEASE_DIR/backend/writable/session" "$RELEASE_DIR/backend/writable/uploads"
touch "$RELEASE_DIR/backend/writable/cache/index.html"

cp -r "$ROOT/admin/dist" "$RELEASE_DIR/admin"
cp -r "$ROOT/cashier/dist" "$RELEASE_DIR/cashier"
cp -r "$ROOT/estore" "$RELEASE_DIR/estore"
cp -r "$ROOT/install" "$RELEASE_DIR/install"
cp "$ROOT/README.md" "$RELEASE_DIR/"
cp "$ROOT/docs/HARDWARE.md" "$RELEASE_DIR/docs-HARDWARE.md" 2>/dev/null || true

cat > "$RELEASE_DIR/INSTALL.txt" << 'EOF'
StarNet Core — встановлення на хостинг
=====================================

1. Завантажте всі файли на хостинг (public_html або піддомен)
2. Відкрийте в браузері: https://ваш-домен/install/
3. Пройдіть майстер (2 кроки) — демо-база встановиться автоматично
4. Готово! Відкрийте /admin/ та /cashier/

Логіни за замовчуванням (демо):
  Адмін:  admin@starnetcore.local / admin123
  Касир:  cashier@starnetcore.local / cashier123

Вимоги: PHP 8.1+, SQLite3, mod_rewrite (Apache)
EOF

cat > "$RELEASE_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=install/">
<title>StarNet Core</title></head>
<body><p><a href="install/">Перейти до інсталятора →</a></p></body></html>
EOF

echo "==> Create ZIP archive"
cd "$ROOT/release"
zip -rq "starnet-core-hosting.zip" starnet-core/
ls -lh "$ARCHIVE"
echo "OK: $ARCHIVE"
