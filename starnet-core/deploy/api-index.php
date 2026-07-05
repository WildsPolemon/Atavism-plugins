<?php
/**
 * Точка входу API (nginx + Apache без доступу до backend/public)
 * URL: https://домен/api/...
 */
declare(strict_types=1);

$public = __DIR__ . '/../backend/public';
if (!is_file($public . '/index.php')) {
    header('Content-Type: text/plain; charset=utf-8', true, 500);
    echo "StarNet Core: backend/public/index.php not found. Unzip archive into site root.\n";
    exit(1);
}

chdir($public);
require $public . '/index.php';
