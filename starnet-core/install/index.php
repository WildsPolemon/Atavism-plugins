<?php
declare(strict_types=1);
require __DIR__ . '/Installer.php';

$root = dirname(__DIR__);
$installer = new StarNetInstaller($root);
$step = $_GET['step'] ?? '1';
$result = null;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $step === 'install') {
    $result = $installer->install([
        'site_url' => $_POST['site_url'] ?? '',
        'admin_email' => $_POST['admin_email'] ?? '',
        'admin_password' => $_POST['admin_password'] ?? '',
        'demo_data' => isset($_POST['demo_data']),
    ]);
    if (!$result['ok']) {
        $error = $result['error'];
        $step = '2';
    } else {
        $step = 'done';
    }
}

$checks = $installer->requirements();
$ready = $installer->allRequirementsOk();
$installed = $installer->isInstalled();

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$guessUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
    . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
    . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/') . '/';
?>
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>StarNet Core — Інсталятор</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Inter,system-ui,sans-serif;background:#f5f5f5;color:#333;min-height:100vh;padding:24px}
    .wrap{max-width:640px;margin:0 auto}
    .card{background:#fff;border-radius:12px;border:1px solid #e5e5e5;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    h1{font-size:1.5rem;color:#1a73e8;margin-bottom:4px}
    .sub{color:#666;font-size:.9rem;margin-bottom:24px}
    .step{color:#1a73e8;font-size:.75rem;font-weight:600;text-transform:uppercase;margin-bottom:8px}
    label{display:block;font-size:.8rem;color:#666;margin:12px 0 4px}
    input[type=text],input[type=email],input[type=password],input[type=url]{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:.95rem}
    .chk{margin:16px 0;display:flex;align-items:center;gap:8px;font-size:.9rem}
    .btn{display:inline-block;margin-top:20px;padding:12px 24px;background:#1a73e8;color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;text-decoration:none}
    .btn:hover{background:#1557b0}
    .btn-o{background:#fff;color:#1a73e8;border:1px solid #1a73e8;margin-right:8px}
    .ok{color:#16a34a}.bad{color:#dc2626}
    ul.req{list-style:none;margin:16px 0}
    ul.req li{padding:6px 0;font-size:.9rem;border-bottom:1px solid #f0f0f0}
    .err{background:#fef2f2;color:#b91c1c;padding:12px;border-radius:8px;margin-bottom:16px;font-size:.9rem}
    .links a{display:block;margin:8px 0;color:#1a73e8}
    .cred{background:#f0f7ff;padding:16px;border-radius:8px;margin:16px 0;font-size:.9rem}
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="step">StarNet Core POS</div>
    <h1>Інсталятор</h1>
    <p class="sub">Встановлення на хостинг за 2 хвилини — без ручних команд</p>

<?php if ($installed && $step !== 'done'): ?>
    <p class="ok">✓ Система вже встановлена.</p>
    <p style="margin-top:16px"><a class="btn" href="../admin/">Відкрити адмін-панель</a>
    <a class="btn btn-o" href="../cashier/">Відкрити касу</a></p>
<?php elseif ($step === 'done' && $result): ?>
    <p class="ok" style="font-size:1.1rem;margin-bottom:16px">✓ Встановлення завершено!</p>
    <div class="cred">
      <strong>Адмін:</strong> <?= h($result['admin_email']) ?><br>
      <strong>Пароль:</strong> <?= h($result['admin_password']) ?><br>
      <?php if ($result['demo']): ?><span class="ok">Демо-база завантажена</span><?php endif; ?>
    </div>
    <div class="links">
      <strong>Посилання:</strong>
      <a href="<?= h($result['links']['admin']) ?>" target="_blank">Адмін-панель →</a>
      <a href="<?= h($result['links']['cashier']) ?>" target="_blank">Каса (POS) →</a>
      <a href="<?= h($result['links']['api']) ?>" target="_blank">API →</a>
    </div>
    <p style="margin-top:20px;font-size:.8rem;color:#888">Видаліть або захистіть папку <code>install/</code> після встановлення.</p>
<?php elseif ($step === '2'): ?>
    <div class="step">Крок 2 з 2</div>
    <h2 style="font-size:1.1rem;margin-bottom:8px">Налаштування сайту</h2>
    <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
    <form method="post" action="?step=install">
      <label>URL сайту (з слешем в кінці)</label>
      <input type="url" name="site_url" required value="<?= h($_POST['site_url'] ?? $guessUrl) ?>" placeholder="https://your-domain.com/">
      <label>Email адміністратора</label>
      <input type="email" name="admin_email" required value="<?= h($_POST['admin_email'] ?? 'admin@starnetcore.local') ?>">
      <label>Пароль адміністратора</label>
      <input type="password" name="admin_password" required value="<?= h($_POST['admin_password'] ?? 'admin123') ?>">
      <label class="chk"><input type="checkbox" name="demo_data" checked> Завантажити демо-базу (товари, касир, категорії)</label>
      <button type="submit" class="btn">Встановити StarNet Core</button>
    </form>
<?php else: ?>
    <div class="step">Крок 1 з 2</div>
    <h2 style="font-size:1.1rem;margin-bottom:8px">Перевірка сервера</h2>
    <ul class="req">
      <?php foreach ($checks as $c): ?>
        <li><span class="<?= $c['ok'] ? 'ok' : 'bad' ?>"><?= $c['ok'] ? '✓' : '✗' ?></span>
          <?= h($c['label']) ?> <?php if ($c['hint']): ?><small style="color:#999">(<?= h($c['hint']) ?>)</small><?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
    <?php if ($ready): ?>
      <a class="btn" href="?step=2">Далі →</a>
    <?php else: ?>
      <p class="bad" style="margin-top:12px">Виправте помилки вище. На shared-хостингу потрібен PHP 8.1+ і SQLite.</p>
    <?php endif; ?>
<?php endif; ?>
  </div>
  <p style="text-align:center;margin-top:16px;font-size:.75rem;color:#999">StarNet Core · клон AinurPOS</p>
</div>
</body>
</html>
