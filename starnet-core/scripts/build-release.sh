#!/usr/bin/env bash
# Збірка ZIP для shared hosting (nginx / Apache). Вміст архіву — прямо в public_html.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/release"
BUILD="$OUT/build"
ZIP="$OUT/starnet-core-hosting.zip"

rm -rf "$BUILD" "$ZIP"
mkdir -p "$BUILD"

echo "==> Admin build"
(cd "$ROOT/admin" && (npm ci --silent 2>/dev/null || npm install --silent))
(cd "$ROOT/admin" && VITE_BASE=/admin/ npm run build)

echo "==> Cashier build"
(cd "$ROOT/cashier" && (npm ci --silent 2>/dev/null || npm install --silent))
(cd "$ROOT/cashier" && VITE_BASE=/cashier/ npm run build)

echo "==> Backend vendor"
(cd "$ROOT/backend" && composer install --no-dev --optimize-autoloader --quiet)

echo "==> Assemble hosting tree"
rsync -a \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='writable/database.db' \
  --exclude='writable/logs/*' \
  --exclude='writable/cache/*' \
  --exclude='writable/session/*' \
  --exclude='writable/uploads/*' \
  --exclude='tests' \
  --exclude='.git' \
  "$ROOT/backend/" "$BUILD/backend/"

mkdir -p "$BUILD/backend/writable/cache" "$BUILD/backend/writable/logs" \
  "$BUILD/backend/writable/session" "$BUILD/backend/writable/uploads"
touch "$BUILD/backend/writable/cache/index.html"

cp -r "$ROOT/admin/dist" "$BUILD/admin"
cp -r "$ROOT/cashier/dist" "$BUILD/cashier"
cp -r "$ROOT/install" "$BUILD/install"
cp -r "$ROOT/estore" "$BUILD/estore"

mkdir -p "$BUILD/api"
cp "$ROOT/deploy/api-index.php" "$BUILD/api/index.php"
cp "$ROOT/deploy/api-htaccess" "$BUILD/api/.htaccess"
cp "$ROOT/deploy/root-index.php" "$BUILD/index.php"
cp "$ROOT/deploy/install.php" "$BUILD/install.php"
cp "$ROOT/deploy/ok.txt" "$BUILD/ok.txt"
cp "$ROOT/deploy/nginx.conf.example" "$BUILD/nginx.conf.example"
cp "$ROOT/install/DEPLOY_MIY.md" "$BUILD/DEPLOY.txt"

cat > "$BUILD/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=install.php">
  <title>StarNet Core</title>
</head>
<body>
  <p><a href="install.php">Перейти до інсталятора StarNet Core →</a></p>
</body>
</html>
EOF

cat > "$BUILD/INSTALL.txt" << 'EOF'
StarNet Core — встановлення на хостинг
=====================================

1. Розпакуйте ВМІСТ цього ZIP у папку домену: mystfall.miy.link/public/
   (myhosting — НЕ public_html! Див. DEPLOY.txt)
2. Відкрийте: https://ваш-домен/install.php
3. Перевірка upload: https://ваш-домен/ok.txt — має показати текст, не 404
3. URL сайту: https://ваш-домен/  (зі слешем)
4. Після встановлення: /admin/ та /cashier/

Детально для mystfall.miy.link — файл DEPLOY.txt

Демо-логіни:
  admin@starnetcore.local / admin123
  cashier@starnetcore.local / cashier123
EOF

echo "==> Create ZIP (flat root)"
(cd "$BUILD" && zip -rq "$ZIP" . -x "*.git*")

SIZE=$(du -h "$ZIP" | cut -f1)
echo "==> Done: $ZIP ($SIZE)"
echo "    Unzip into public_html, then open /install/index.php"
