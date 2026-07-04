<?php

namespace App\Controllers\Api;

class StoreController extends BaseApiController
{
    public function index()
    {
        return $this->ok(['stores' => db_connect()->table('stores')->where('active', 1)->get()->getResultArray()]);
    }

    public function create()
    {
        $b = $this->request->getJSON(true) ?? [];
        $id = db_connect()->table('stores')->insert([
            'name' => $b['name'],
            'address' => $b['address'] ?? '',
            'phone' => $b['phone'] ?? '',
        ]);
        return $this->ok(db_connect()->table('stores')->where('id', $id)->get()->getRowArray(), 201);
    }
}
