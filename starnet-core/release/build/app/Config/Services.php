<?php

namespace Config;

use App\Libraries\JwtAuth;
use CodeIgniter\Config\BaseService;

class Services extends BaseService
{
    public static function jwtauth(bool $getShared = true): JwtAuth
    {
        if ($getShared) {
            return static::getSharedInstance('jwtauth');
        }
        return new JwtAuth();
    }
}
