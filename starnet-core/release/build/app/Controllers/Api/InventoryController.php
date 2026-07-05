<?php

namespace App\Controllers\Api;

use App\Libraries\StockService;

class InventoryController extends BaseApiController
{
    public function index()
    {
        $rows = db_connect()->table('inventory_counts ic')
            ->select('ic.*, w.name as warehouse_name')
            ->join('warehouses w', 'w.id = ic.warehouse_id', 'left')
            ->orderBy('ic.created_at', 'DESC')
            ->limit(30)
            ->get()->getResultArray();
        return $this->ok(['counts' => $rows]);
    }

    public function create()
    {
        $body = $this->request->getJSON(true) ?? [];
        $warehouseId = (int) ($body['warehouse_id'] ?? 0);
        if (!$warehouseId) {
            return $this->err('Оберіть склад');
        }

        $db = db_connect();
        $countId = $db->table('inventory_counts')->insert([
            'warehouse_id' => $warehouseId,
            'status' => 'open',
            'notes' => $body['notes'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        $stock = $db->table('stock st')
            ->select('st.product_id, st.quantity, p.name')
            ->join('products p', 'p.id = st.product_id')
            ->where('st.warehouse_id', $warehouseId)
            ->where('p.active', 1)
            ->get()->getResultArray();

        foreach ($stock as $s) {
            $db->table('inventory_count_items')->insert([
                'inventory_count_id' => $countId,
                'product_id' => $s['product_id'],
                'expected_qty' => $s['quantity'],
            ]);
        }

        return $this->ok(['id' => $countId], 201);
    }

    public function show(int $id)
    {
        $count = db_connect()->table('inventory_counts')->where('id', $id)->get()->getRowArray();
        if (!$count) {
            return $this->err('Не знайдено', 404);
        }
        $items = db_connect()->table('inventory_count_items ici')
            ->select('ici.*, p.name, p.barcode, p.sku')
            ->join('products p', 'p.id = ici.product_id')
            ->where('inventory_count_id', $id)
            ->orderBy('p.name')
            ->get()->getResultArray();
        return $this->ok(['count' => $count, 'items' => $items]);
    }

    public function updateItem(int $id, int $itemId)
    {
        $qty = (float) (($this->request->getJSON(true) ?? [])['actual_qty'] ?? -1);
        if ($qty < 0) {
            return $this->err('Вкажіть фактичну кількість');
        }
        db_connect()->table('inventory_count_items')
            ->where('id', $itemId)
            ->where('inventory_count_id', $id)
            ->update(['actual_qty' => $qty]);
        return $this->ok(['ok' => true]);
    }

    public function complete(int $id)
    {
        $db = db_connect();
        $count = $db->table('inventory_counts')->where('id', $id)->get()->getRowArray();
        if (!$count || $count['status'] !== 'open') {
            return $this->err('Інвентаризація недоступна');
        }

        $items = $db->table('inventory_count_items')->where('inventory_count_id', $id)->get()->getResultArray();
        $stock = new StockService();
        $jwt = $this->jwtUser();

        foreach ($items as $it) {
            if ($it['actual_qty'] === null) {
                continue;
            }
            $expected = (float) $it['expected_qty'];
            $actual = (float) $it['actual_qty'];
            if ($actual !== $expected) {
                $stock->adjust((int) $count['warehouse_id'], (int) $it['product_id'], $actual - $expected);
                $stock->logOperation([
                    'type' => 'inventory',
                    'warehouse_id' => $count['warehouse_id'],
                    'product_id' => $it['product_id'],
                    'quantity' => abs($actual - $expected),
                    'user_id' => $jwt['sub'] ?? null,
                    'notes' => 'Інвентаризація #' . $id,
                ]);
            }
        }

        $db->table('inventory_counts')->where('id', $id)->update([
            'status' => 'completed',
            'completed_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->ok(['ok' => true]);
    }
}
