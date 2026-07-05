<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class ApiAuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $jwt = service('jwtauth')->userFromRequest();
        if (!$jwt) {
            return service('response')->setStatusCode(401)->setJSON(['error' => 'Unauthorized']);
        }
        if ($arguments && !in_array($jwt['role'] ?? '', $arguments, true)) {
            return service('response')->setStatusCode(403)->setJSON(['error' => 'Forbidden']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
