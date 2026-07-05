<?php

namespace App\Controllers\Api;

use App\Libraries\BarcodeLookup;

class BarcodeController extends BaseApiController
{
    public function show(string $code)
    {
        $result = (new BarcodeLookup())->lookup($code);
        if (!$result['found']) {
            return $this->response->setStatusCode(404)->setJSON($result);
        }
        return $this->ok($result);
    }
}
