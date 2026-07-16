#!/usr/bin/env bash
# ZIP для хостингу: плоский корінь, один index.php, без папки api/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/release"
BUILD="$OUT/build"
ZIP="$OUT/starnet-core-hosting.zip"

rm -rf "$BUILD" "$ZIP"
mkdir -p "$BUILD"

echo "==> Admin + Cashier"
(cd "$ROOT/admin" && (npm ci --silent 2>/dev/null || npm install --silent) && VITE_BASE=/admin/ npm run build)
(cd "$ROOT/cashier" && (npm ci --silent 2>/dev/null || npm install --silent) && VITE_BASE=/cashier/ npm run build)

echo "==> Backend"
(cd "$ROOT/backend" && composer install --no-dev --optimize-autoloader --quiet)

echo "==> Assemble (flat root)"
rsync -a \
  --exclude='node_modules' --exclude='.env' --exclude='writable/database.db' \
  --exclude='writable/logs/*' --exclude='writable/cache/*' \
  --exclude='writable/session/*' --exclude='writable/uploads/*' \
  --exclude='tests' --exclude='public' --exclude='.git' \
  "$ROOT/backend/" "$BUILD/"

mkdir -p "$BUILD/writable/cache" "$BUILD/writable/logs" \
  "$BUILD/writable/session" "$BUILD/writable/uploads"
touch "$BUILD/writable/cache/index.html"

cp "$ROOT/deploy/index.php" "$BUILD/index.php"
cp "$ROOT/deploy/htaccess-root" "$BUILD/.htaccess"
cp "$ROOT/deploy/install.php" "$BUILD/install.php"
cp "$ROOT/deploy/ok.txt" "$BUILD/ok.txt"
cp "$ROOT/deploy/index.html" "$BUILD/index.html"
cp "$ROOT/deploy/root-check.php" "$BUILD/root-check.php"
cp "$ROOT/deploy/404-FIX.txt" "$BUILD/404-FIX.txt"
cp -r "$ROOT/install" "$BUILD/install"
cp -r "$ROOT/admin/dist" "$BUILD/admin"
cp -r "$ROOT/cashier/dist" "$BUILD/cashier"
cp -r "$ROOT/estore" "$BUILD/estore"
cp -r "$ROOT/portal" "$BUILD/portal"

cat > "$BUILD/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><title>StarNet OK</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px;background:#e8f5e9">
  <h1 style="color:#2e7d32">✓ Файли на правильному місці</h1>
  <p><a href="install.php" style="font-size:1.2rem">install.php</a> — установка</p>
  <p style="color:#666;font-size:.9rem">404? Читайте 404-FIX.txt</p>
</body></html>
EOF

cat > "$BUILD/INSTALL.txt" << 'EOF'
StarNet Core — установка
========================

1. Распакуйте ВСЁ содержимое ZIP в папку сайта:
   mystfall.miy.link/public/   (myhosting / panel21)

2. Проверка: https://ваш-домен/ok.txt  (не должно быть 404)

3. Установка: https://ваш-домен/install.php
   URL сайта: https://ваш-домен/

4. Готово:
   /admin/   — адмін
   /cashier/ — каса
   /portal/  — вхід / реєстрація
EOF

echo "==> ZIP"
(cd "$BUILD" && zip -rq "$ZIP" . -x "*.git*")
ls -lh "$ZIP"

# Мини-архив для поиска правильной папки
DIAG="$OUT/upload-diagnostic.zip"
rm -f "$DIAG"
(cd "$ROOT/deploy" && zip -q "$DIAG" ok.txt index.html root-check.php 404-FIX.txt)
cp "$ROOT/deploy/404-FIX.txt" "$OUT/404-FIX.txt"
ls -lh "$DIAG"
