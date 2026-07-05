<?php
/**
 * StarNet Core — веб-інсталятор (плоский корінь хостингу)
 */
declare(strict_types=1);

class StarNetInstaller
{
    private string $root;
    private string $lockFile;

    public function __construct(string $root)
    {
        $this->root = rtrim($root, '/');
        $this->lockFile = $this->root . '/writable/installed.lock';
    }

    public function isInstalled(): bool
    {
        return file_exists($this->lockFile) && file_exists($this->root . '/.env');
    }

    public function requirements(): array
    {
        $writable = [
            $this->root . '/writable',
            $this->root . '/writable/cache',
            $this->root . '/writable/logs',
            $this->root . '/writable/session',
            $this->root . '/writable/uploads',
        ];
        $checks = [
            ['label' => 'PHP 8.1+', 'ok' => version_compare(PHP_VERSION, '8.1.0', '>='), 'hint' => PHP_VERSION],
            ['label' => 'SQLite3', 'ok' => extension_loaded('sqlite3'), 'hint' => ''],
            ['label' => 'mbstring', 'ok' => extension_loaded('mbstring'), 'hint' => ''],
            ['label' => 'json', 'ok' => extension_loaded('json'), 'hint' => ''],
            ['label' => 'intl', 'ok' => extension_loaded('intl'), 'hint' => ''],
            ['label' => 'vendor/', 'ok' => is_dir($this->root . '/vendor'), 'hint' => ''],
            ['label' => 'exec()', 'ok' => function_exists('exec'), 'hint' => 'міграції'],
        ];
        foreach ($writable as $dir) {
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            $checks[] = [
                'label' => 'Запис: ' . basename(dirname($dir)) . '/' . basename($dir),
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
            return ['ok' => false, 'error' => 'Вже встановлено. Видаліть writable/installed.lock для перевстановлення.'];
        }

        $siteUrl = rtrim($opts['site_url'] ?? '', '/') . '/';
        $adminEmail = trim($opts['admin_email'] ?? 'admin@starnetcore.local');
        $adminPass = $opts['admin_password'] ?? 'admin123';
        $jwt = bin2hex(random_bytes(32));
        $demo = !empty($opts['demo_data']);

        $cors = $siteUrl . 'admin/, ' . $siteUrl . 'cashier/';

        $env = <<<ENV
CI_ENVIRONMENT = production
app.baseURL = '{$siteUrl}'
app.forceGlobalSecureRequests = false

database.default.database = WRITEPATH . 'database.db'
database.default.DBDriver = SQLite3
database.default.foreignKeys = true

starnetcore.corsOrigins = {$cors}
starnetcore.jwtSecret = {$jwt}
starnetcore.adminEmail = {$adminEmail}
starnetcore.adminPassword = {$adminPass}
ENV;

        if (!file_put_contents($this->root . '/.env', $env)) {
            return ['ok' => false, 'error' => 'Не вдалося записати .env'];
        }

        $dbPath = $this->root . '/writable/database.db';
        if (file_exists($dbPath)) {
            @unlink($dbPath);
        }

        $php = escapeshellarg(PHP_BINARY);
        $root = escapeshellarg($this->root);

        $migrate = [];
        $code = 0;
        exec("cd {$root} && {$php} spark migrate --all 2>&1", $migrate, $code);
        if ($code !== 0) {
            return ['ok' => false, 'error' => 'Міграція: ' . implode("\n", $migrate)];
        }

        if ($demo) {
            $seed = [];
            exec("cd {$root} && {$php} spark db:seed StarnetSeeder 2>&1", $seed, $code);
            if ($code !== 0) {
                return ['ok' => false, 'error' => 'Демо-дані: ' . implode("\n", $seed)];
            }
        } else {
            exec("cd {$root} && {$php} spark db:seed StarnetSeeder 2>&1");
        }

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
            ],
        ];
    }
}
