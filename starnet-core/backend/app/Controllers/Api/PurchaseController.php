<?php

namespace App\Controllers\Api;

use App\Libraries\StockService;

class PurchaseController extends BaseApiController
{
    public function index()
    {
        $rows = db_connect()->table('purchase_orders po')
            ->select('po.*, s.name as supplier_name, w.name as warehouse_name')
            ->join('suppliers s', 's.id = po.supplier_id', 'left')
            ->join('warehouses w', 'w.id = po.warehouse_id', 'left')
            ->orderBy('po.created_at', 'DESC')
            ->limit(50)
            ->get()->getResultArray();
        return $this->ok(['orders' => $rows]);
    }

    public function create()
    {
        $body = $this->request->getJSON(true) ?? [];
        $items = $body['items'] ?? [];
        if (!$items) {
            return $this->err('Додайте товари до замовлення');
        }

        $total = 0;
        foreach ($items as $it) {
            $total += (float) ($it['cost'] ?? 0) * (float) ($it['quantity'] ?? 0);
        }

        $db = db_connect();
        $poId = $db->table('purchase_orders')->insert([
            'supplier_id' => $body['supplier_id'] ?? null,
            'warehouse_id' => (int) ($body['warehouse_id'] ?? 1),
            'status' => 'draft',
            'total' => $total,
            'notes' => $body['notes'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        foreach ($items as $it) {
            $qty = (float) ($it['quantity'] ?? 0);
            $cost = (float) ($it['cost'] ?? 0);
            $db->table('purchase_order_items')->insert([
                'purchase_order_id' => $poId,
                'product_id' => $it['product_id'],
                'quantity' => $qty,
                'cost' => $cost,
                'total' => $qty * $cost,
            ]);
        }

        return $this->ok(['id' => $poId], 201);
    }

    public function receive(int $id)
    {
        $db = db_connect();
        $po = $db->table('purchase_orders')->where('id', $id)->get()->getRowArray();
        if (!$po || $po['status'] === 'received') {
            return $this->err('Замовлення не знайдено або вже отримано');
        }

        $items = $db->table('purchase_order_items')->where('purchase_order_id', $id)->get()->getResultArray();
        $stock = new StockService();
        $jwt = $this->jwtUser();

        foreach ($items as $it) {
            $stock->adjust((int) $po['warehouse_id'], (int) $it['product_id'], (float) $it['quantity']);
            if ($it['cost'] > 0) {
                $db->table('products')->where('id', $it['product_id'])->update(['cost_price' => $it['cost']]);
            }
            $stock->logOperation([
                'type' => 'purchase',
                'warehouse_id' => $po['warehouse_id'],
                'supplier_id' => $po['supplier_id'],
                'product_id' => $it['product_id'],
                'quantity' => $it['quantity'],
                'cost' => $it['cost'],
                'user_id' => $jwt['sub'] ?? null,
                'notes' => 'PO #' . $id,
            ]);
        }

        $db->table('purchase_orders')->where('id', $id)->update([
            'status' => 'received',
            'received_at' => date('Y-m-d H:i:s'),
        ]);

        if ($po['supplier_id']) {
            $db->query('UPDATE suppliers SET debt = debt + ? WHERE id = ?', [$po['total'], $po['supplier_id']]);
        }

        return $this->ok(['ok' => true]);
    }
}
