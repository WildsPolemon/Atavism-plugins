<?php

namespace App\Controllers\Api;

use App\Libraries\TextTemplate;
use App\Models\CustomerModel;
use App\Models\UserModel;

class PortalController extends BaseApiController
{
    public function config()
    {
        $settings = $this->settingsMap();
        $siteName = $settings['site_name'] ?? $settings['company_name'] ?? 'StarNet Core';
        return $this->ok([
            'site_name' => $siteName,
            'welcome_message' => $settings['portal_welcome_message']
                ?? 'Ласкаво просимо до {site_name}! Стартовий бонус нараховано.',
            'welcome_message_resolved' => TextTemplate::apply(
                $settings['portal_welcome_message'] ?? 'Ласкаво просимо до {site_name}! Стартовий бонус нараховано.',
                ['site_name' => $siteName]
            ),
            'welcome_bonus' => (float) ($settings['portal_welcome_bonus'] ?? 100),
        ]);
    }

    public function register()
    {
        $body = $this->request->getJSON(true) ?? [];
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($username === '' || strlen($password) < 4) {
            return $this->err('Вкажіть логін і пароль (мін. 4 символи)');
        }
        if (!preg_match('/^[a-zA-Z0-9._-]{2,32}$/', $username)) {
            return $this->err('Недопустимий логін');
        }

        $email = strtolower($username) . '@portal.local';
        $userModel = model(UserModel::class);
        if ($userModel->where('email', $email)->countAllResults()) {
            return $this->err('Такий логін уже зайнятий');
        }

        $settings = $this->settingsMap();
        $bonus = (float) ($settings['portal_welcome_bonus'] ?? 100);
        $siteName = $settings['site_name'] ?? $settings['company_name'] ?? 'StarNet Core';
        $template = $settings['portal_welcome_message']
            ?? 'Ласкаво просимо до {site_name}! Стартовий бонус нараховано.';

        $userId = $userModel->insert([
            'name' => $username,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role' => 'player',
            'active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        model(CustomerModel::class)->insert([
            'name' => $username,
            'phone' => '',
            'email' => $email,
            'loyalty_points' => $bonus,
            'notes' => 'Portal registration',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        $token = service('jwtauth')->issue($userModel->find($userId));
        $welcome = TextTemplate::apply($template, ['site_name' => $siteName]);

        return $this->ok([
            'token' => $token,
            'welcome' => $welcome,
            'bonus' => $bonus,
            'user' => ['id' => $userId, 'name' => $username, 'role' => 'player'],
        ], 201);
    }

    public function login()
    {
        $body = $this->request->getJSON(true) ?? [];
        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($username === '' || $password === '') {
            return $this->err('Вкажіть логін і пароль', 401);
        }

        $email = str_contains($username, '@') ? $username : strtolower($username) . '@portal.local';
        $user = model(UserModel::class)->where('email', $email)->where('active', 1)->first();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->err('Невірний логін або пароль', 401);
        }

        unset($user['password_hash']);
        return $this->ok([
            'token' => service('jwtauth')->issue($user),
            'user' => $user,
        ]);
    }

    private function settingsMap(): array
    {
        $out = [];
        foreach (db_connect()->table('settings')->get()->getResultArray() as $row) {
            $out[$row['key']] = $row['value'];
        }
        return $out;
    }
}
