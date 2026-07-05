<?php

namespace App\Controllers\Api;

use App\Libraries\JwtAuth;
use App\Models\UserModel;

class AuthController extends BaseApiController
{
    public function login()
    {
        $body = $this->request->getJSON(true) ?? [];
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';

        $userModel = model(UserModel::class);
        $user = $userModel->where('email', $email)->where('active', 1)->first();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->err('Невірний email або пароль', 401);
        }

        unset($user['password_hash']);
        $token = service('jwtauth')->issue($user);
        return $this->ok(['user' => $user, 'token' => $token]);
    }

    public function me()
    {
        $jwt = service('jwtauth')->userFromRequest();
        if (!$jwt) {
            return $this->err('Unauthorized', 401);
        }
        $user = model(UserModel::class)->find($jwt['sub']);
        if (!$user) {
            return $this->err('Unauthorized', 401);
        }
        unset($user['password_hash']);
        return $this->ok($user);
    }
}
