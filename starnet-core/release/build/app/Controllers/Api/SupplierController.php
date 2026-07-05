<?php

namespace App\Controllers\Api;

class SupplierController extends BaseApiController
{
    public function index()
    {
        $rows = db_connect()->table('suppliers')->where('active', 1)->orderBy('name')->get()->getResultArray();
        return $this->ok(['suppliers' => $rows]);
    }

    public function create()
    {
        $b = $this->request->getJSON(true) ?? [];
        $id = db_connect()->table('suppliers')->insert([
            'name' => $b['name'],
            'phone' => $b['phone'] ?? '',
            'email' => $b['email'] ?? '',
            'notes' => $b['notes'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->ok(db_connect()->table('suppliers')->where('id', $id)->get()->getRowArray(), 201);
    }

    public function stats()
    {
        return $this->ok(['suppliers' => db_connect()->table('suppliers')->select('id,name,debt')->get()->getResultArray()]);
    }
}
