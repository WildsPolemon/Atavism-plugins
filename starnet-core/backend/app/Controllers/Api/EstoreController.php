<?php

namespace App\Controllers\Api;

class EstoreController extends BaseApiController
{
    public function catalog()
    {
        $products = db_connect()->table('products')
            ->where('active', 1)
            ->where('estore_visible', 1)
            ->orderBy('name')
            ->get()->getResultArray();
        $settings = $this->settingsMap();
        return $this->ok(['products' => $products, 'settings' => $settings]);
    }

    public function order()
    {
        $body = $this->request->getJSON(true) ?? [];
        $items = $body['items'] ?? [];
        if (!$items || empty($body['customer_name'])) {
            return $this->err('Заповніть ім\'я та товари');
        }

        $db = db_connect();
        $total = 0;
        $lineItems = [];
        foreach ($items as $it) {
            $p = $db->table('products')->where('id', $it['product_id'])->get()->getRowArray();
            if (!$p) {
                continue;
            }
            $price = (float) ($p['sale_price'] ?: $p['retail_price']);
            $qty = (float) ($it['quantity'] ?? 1);
            $lineTotal = $price * $qty;
            $total += $lineTotal;
            $lineItems[] = compact('p', 'price', 'qty', 'lineTotal');
        }

        $orderId = $db->table('estore_orders')->insert([
            'customer_name' => $body['customer_name'],
            'phone' => $body['phone'] ?? null,
            'email' => $body['email'] ?? null,
            'delivery_type' => $body['delivery_type'] ?? 'pickup',
            'address' => $body['address'] ?? null,
            'total' => $total,
            'notes' => $body['notes'] ?? null,
            'status' => 'new',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        foreach ($lineItems as $li) {
            $db->table('estore_order_items')->insert([
                'estore_order_id' => $orderId,
                'product_id' => $li['p']['id'],
                'quantity' => $li['qty'],
                'price' => $li['price'],
                'total' => $li['lineTotal'],
            ]);
        }

        return $this->ok(['id' => $orderId, 'total' => $total], 201);
    }

    public function orders()
    {
        $orders = db_connect()->table('estore_orders')->orderBy('created_at', 'DESC')->limit(50)->get()->getResultArray();
        return $this->ok(['orders' => $orders]);
    }

    public function updateOrderStatus(int $id)
    {
        $status = ($this->request->getJSON(true) ?? [])['status'] ?? '';
        if (!in_array($status, ['new', 'processing', 'ready', 'completed', 'cancelled'], true)) {
            return $this->err('Невірний статус');
        }
        db_connect()->table('estore_orders')->where('id', $id)->update(['status' => $status]);
        return $this->ok(['ok' => true]);
    }

    private function settingsMap(): array
    {
        $rows = db_connect()->table('settings')->get()->getResultArray();
        $out = [];
        foreach ($rows as $r) {
            $out[$r['key']] = $r['value'];
        }
        return $out;
    }
}
