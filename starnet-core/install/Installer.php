<?php
/**
 * StarNet Core — веб-інсталятор (плоский корінь хостингу)
 */
declare(strict_types=1);

require_once __DIR__ . '/MigrateRunner.php';

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
        $execOk = function_exists('exec') && !in_array('exec', array_map('trim', explode(',', (string) ini_get('disable_functions'))), true);
        $checks = [
            ['label' => 'PHP 8.1+', 'ok' => version_compare(PHP_VERSION, '8.1.0', '>='), 'hint' => PHP_VERSION, 'required' => true],
            ['label' => 'SQLite3', 'ok' => extension_loaded('sqlite3'), 'hint' => '', 'required' => true],
            ['label' => 'mbstring', 'ok' => extension_loaded('mbstring'), 'hint' => '', 'required' => true],
            ['label' => 'json', 'ok' => extension_loaded('json'), 'hint' => '', 'required' => true],
            ['label' => 'intl', 'ok' => extension_loaded('intl'), 'hint' => '', 'required' => true],
            ['label' => 'vendor/', 'ok' => is_dir($this->root . '/vendor'), 'hint' => '', 'required' => true],
            ['label' => 'exec()', 'ok' => true, 'hint' => $execOk ? 'є (не обовʼязково)' : 'вимкнено — ОК, вбудований режим', 'required' => false],
        ];
        foreach ($writable as $dir) {
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            $checks[] = [
                'label' => 'Запис: ' . basename(dirname($dir)) . '/' . basename($dir),
                'ok' => is_writable($dir),
                'hint' => 'chmod 755',
                'required' => true,
            ];
        }
        return $checks;
    }

    public function allRequirementsOk(): bool
    {
        foreach ($this->requirements() as $c) {
            if (!empty($c['required']) && !$c['ok']) {
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

starnetcore.corsOrigins = '{$cors}'
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

        try {
            MigrateRunner::migrateAndSeed($this->root);
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
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
