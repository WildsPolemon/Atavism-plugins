<?php
/**
 * Міграції та seed без exec() — для shared-хостингу
 */
declare(strict_types=1);

use CodeIgniter\Boot;
use CodeIgniter\Database\Seeder;
use Config\App;
use Config\Database;
use Config\Paths;
use Config\Services;

final class MigrateRunner
{
    public static function migrateAndSeed(string $root): void
    {
        $root = rtrim($root, '/');

        if (!is_file($root . '/spark')) {
            throw new RuntimeException('Не знайдено spark у корені сайту');
        }

        if (!defined('FCPATH')) {
            define('FCPATH', $root . DIRECTORY_SEPARATOR);
        }
        if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
            chdir(FCPATH);
        }

        require FCPATH . 'app/Config/Paths.php';
        $paths = new Paths();
        require $paths->systemDirectory . '/Boot.php';

        self::bootApp($paths);

        $runner = service('migrations');
        $runner->clearCliMessages();
        $runner->setNamespace(null);

        if (!$runner->latest()) {
            $msgs = $runner->getCliMessages();
            throw new RuntimeException('Міграція не вдалась: ' . implode("\n", $msgs ?: ['unknown']));
        }

        $seeder = new Seeder(new Database());
        $seeder->call('StarnetSeeder');
    }

    private static function bootApp(Paths $paths): void
    {
        $ref = new ReflectionClass(Boot::class);

        foreach ([
            ['definePathConstants', [$paths]],
            ['loadConstants', []],
            ['checkMissingExtensions', []],
            ['loadDotEnv', [$paths]],
            ['defineEnvironment', []],
            ['loadEnvironmentBootstrap', [$paths, false]],
            ['loadCommonFunctions', []],
            ['loadAutoloader', []],
            ['setExceptionHandler', []],
            ['initializeKint', []],
            ['autoloadHelpers', []],
        ] as [$method, $args]) {
            $m = $ref->getMethod($method);
            $m->setAccessible(true);
            $m->invokeArgs(null, $args);
        }

        $init = $ref->getMethod('initializeCodeIgniter');
        $init->setAccessible(true);
        $init->invoke(null);

        Services::createRequest(new App(), true);
        service('routes')->loadRoutes();
    }
}
