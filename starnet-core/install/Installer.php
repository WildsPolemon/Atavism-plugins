<?php
/**
 * StarNet Core — веб-інсталятор для хостингу
 */
declare(strict_types=1);

class StarNetInstaller
{
    private string $root;
    private string $backend;
    private string $lockFile;

    public function __construct(string $root)
    {
        $this->root = rtrim($root, '/');
        $this->backend = $this->root . '/backend';
        $this->lockFile = $this->backend . '/writable/installed.lock';
    }

    public function isInstalled(): bool
    {
        return file_exists($this->lockFile) && file_exists($this->backend . '/.env');
    }

    public function requirements(): array
    {
        $writable = [
            $this->backend . '/writable',
            $this->backend . '/writable/cache',
            $this->backend . '/writable/logs',
            $this->backend . '/writable/session',
            $this->backend . '/writable/uploads',
        ];
        $checks = [
            ['label' => 'PHP 8.1+', 'ok' => version_compare(PHP_VERSION, '8.1.0', '>='), 'hint' => PHP_VERSION],
            ['label' => 'Розширення SQLite3', 'ok' => extension_loaded('sqlite3'), 'hint' => ''],
            ['label' => 'Розширення mbstring', 'ok' => extension_loaded('mbstring'), 'hint' => ''],
            ['label' => 'Розширення json', 'ok' => extension_loaded('json'), 'hint' => ''],
            ['label' => 'Розширення intl', 'ok' => extension_loaded('intl'), 'hint' => ''],
            ['label' => 'Composer vendor', 'ok' => is_dir($this->backend . '/vendor'), 'hint' => 'backend/vendor'],
            ['label' => 'Функція exec', 'ok' => function_exists('exec'), 'hint' => 'для міграцій'],
        ];
        foreach ($writable as $dir) {
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            $checks[] = [
                'label' => 'Запис: ' . str_replace($this->root . '/', '', $dir),
                'ok' => is_writable($dir),
                'hint' => 'chmod 755',
            ];
        }
        return $checks;
    }

    public function allRequirementsOk(): bool
    {
        foreach ($this->requirements() as $c) {
            if (!$c['ok']) {
                return false;
            }
        }
        return true;
    }

    public function install(array $opts): array
    {
        if ($this->isInstalled()) {
            return ['ok' => false, 'error' => 'Вже встановлено. Видаліть backend/writable/installed.lock для перевстановлення.'];
        }

        $siteUrl = rtrim($opts['site_url'] ?? '', '/') . '/';
        $adminEmail = trim($opts['admin_email'] ?? 'admin@starnetcore.local');
        $adminPass = $opts['admin_password'] ?? 'admin123';
        $jwt = bin2hex(random_bytes(32));
        $demo = !empty($opts['demo_data']);

        $cors = $siteUrl . 'admin/, ' . $siteUrl . 'cashier/, ' . $siteUrl . 'estore/';

        $env = <<<ENV
CI_ENVIRONMENT = production
app.baseURL = '{$siteUrl}api/'
app.forceGlobalSecureRequests = false

database.default.database = WRITEPATH . 'database.db'
database.default.DBDriver = SQLite3
database.default.foreignKeys = true

starnetcore.corsOrigins = {$cors}
starnetcore.jwtSecret = {$jwt}
starnetcore.adminEmail = {$adminEmail}
starnetcore.adminPassword = {$adminPass}
ENV;

        if (!file_put_contents($this->backend . '/.env', $env)) {
            return ['ok' => false, 'error' => 'Не вдалося записати backend/.env'];
        }

        $dbPath = $this->backend . '/writable/database.db';
        if (file_exists($dbPath)) {
            @unlink($dbPath);
        }

        $php = escapeshellarg(PHP_BINARY);
        $backend = escapeshellarg($this->backend);

        $migrate = [];
        $code = 0;
        exec("cd {$backend} && {$php} spark migrate --all 2>&1", $migrate, $code);
        if ($code !== 0) {
            return ['ok' => false, 'error' => 'Міграція: ' . implode("\n", $migrate)];
        }

        if ($demo) {
            $seed = [];
            exec("cd {$backend} && {$php} spark db:seed StarnetSeeder 2>&1", $seed, $code);
            if ($code !== 0) {
                return ['ok' => false, 'error' => 'Демо-дані: ' . implode("\n", $seed)];
            }
        } else {
            $this->seedAdminOnly($adminEmail, $adminPass);
        }

        $this->writeHtaccess($siteUrl);
        file_put_contents($this->lockFile, date('c') . "\n" . $siteUrl);

        return [
            'ok' => true,
            'site_url' => $siteUrl,
            'admin_email' => $adminEmail,
            'admin_password' => $adminPass,
            'demo' => $demo,
            'links' => [
                'admin' => $siteUrl . 'admin/',
                'cashier' => $siteUrl . 'cashier/',
                'api' => $siteUrl . 'api/',
            ],
        ];
    }

    private function seedAdminOnly(string $email, string $pass): void
    {
        $php = escapeshellarg(PHP_BINARY);
        $backend = escapeshellarg($this->backend);
        exec("cd {$backend} && {$php} spark db:seed StarnetSeeder 2>&1");
    }

    private function writeHtaccess(string $siteUrl): void
    {
        $htaccess = <<<'HTA'
# StarNet Core — маршрутизація API
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [L,QSA]
</IfModule>
HTA;
        @file_put_contents($this->backend . '/public/.htaccess', $htaccess);

        $rootHt = <<<'HTA'
# StarNet Core
DirectoryIndex index.html
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^api/?(.*)$ backend/public/index.php/api/$1 [L,QSA]
RewriteRule ^$ install/ [L,R=302]
</IfModule>
HTA;
        @file_put_contents($this->root . '/.htaccess', $rootHt);
    }
}
