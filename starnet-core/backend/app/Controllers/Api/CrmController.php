<?php

namespace App\Controllers\Api;

use App\Models\CustomerModel;

class CrmController extends BaseApiController
{
    public function customers()
    {
        $search = trim($this->request->getGet('search') ?? '');
        $m = model(CustomerModel::class);
        if ($search) {
            $m->groupStart()->like('name', $search)->orLike('phone', $search)->groupEnd();
        }
        return $this->ok(['customers' => $m->orderBy('created_at', 'DESC')->findAll(100)]);
    }

    public function createCustomer()
    {
        $body = $this->request->getJSON(true) ?? [];
        $id = model(CustomerModel::class)->insert([
            'name' => $body['name'],
            'phone' => $body['phone'] ?? '',
            'email' => $body['email'] ?? '',
            'notes' => $body['notes'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->ok(model(CustomerModel::class)->find($id), 201);
    }

    public function show(int $id)
    {
        $c = model(CustomerModel::class)->find($id);
        if (!$c) return $this->err('Not found', 404);
        $purchases = db_connect()->table('sales')->where('customer_id', $id)->orderBy('created_at', 'DESC')->limit(50)->get()->getResultArray();
        return $this->ok([...$c, 'purchases' => $purchases]);
    }
}
