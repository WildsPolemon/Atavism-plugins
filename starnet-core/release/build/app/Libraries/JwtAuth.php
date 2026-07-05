<?php

namespace App\Libraries;

use Config\Services;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtAuth
{
    protected string $secret;

    public function __construct()
    {
        $this->secret = env('starnetcore.jwtSecret', 'dev-secret');
    }

    public function issue(array $user): string
    {
        $payload = [
            'sub' => $user['id'],
            'role' => $user['role'],
            'name' => $user['name'],
            'iat' => time(),
            'exp' => time() + 86400 * 7,
        ];
        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function decode(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            return (array) $decoded;
        } catch (\Throwable) {
            return null;
        }
    }

    public function userFromRequest(): ?array
    {
        $request = Services::request();
        $header = $request->getHeaderLine('Authorization');
        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }
        return $this->decode(substr($header, 7));
    }
}
