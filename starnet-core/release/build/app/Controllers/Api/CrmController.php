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
            'card_number' => $body['card_number'] ?? null,
            'discount_percent' => (float) ($body['discount_percent'] ?? 0),
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

    public function updateCustomer(int $id)
    {
        $body = $this->request->getJSON(true) ?? [];
        $allowed = ['name', 'phone', 'email', 'notes', 'debt', 'discount_percent', 'loyalty_points', 'card_number'];
        $data = array_intersect_key($body, array_flip($allowed));
        if (!$data) {
            return $this->err('Немає даних');
        }
        model(CustomerModel::class)->update($id, $data);
        return $this->ok(model(CustomerModel::class)->find($id));
    }
}
