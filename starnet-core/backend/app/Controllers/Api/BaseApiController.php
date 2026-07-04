<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class BaseApiController extends BaseController
{
    protected function ok($data = null, int $code = 200): ResponseInterface
    {
        return $this->response->setStatusCode($code)->setJSON($data ?? ['ok' => true]);
    }

    protected function err(string $message, int $code = 400): ResponseInterface
    {
        return $this->response->setStatusCode($code)->setJSON(['error' => $message]);
    }

    protected function jwtUser(): ?array
    {
        return service('jwtauth')->userFromRequest();
    }
}
