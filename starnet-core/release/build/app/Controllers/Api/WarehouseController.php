<?php

namespace App\Controllers\Api;

use App\Libraries\StockService;

class WarehouseController extends BaseApiController
{
    public function stock()
    {
        $wid = $this->request->getGet('warehouse_id');
        $db = db_connect();
        $b = $db->table('stock st')
            ->select('st.*, p.name, p.sku, p.barcode, p.retail_price, p.cost_price, w.name as warehouse_name')
            ->join('products p', 'p.id = st.product_id')
            ->join('warehouses w', 'w.id = st.warehouse_id')
            ->where('p.active', 1);
        if ($wid) {
            $b->where('st.warehouse_id', $wid);
        }
        return $this->ok(['stock' => $b->orderBy('p.name')->get()->getResultArray()]);
    }

    public function warehouses()
    {
        return $this->ok(['warehouses' => db_connect()->table('warehouses')->where('active', 1)->get()->getResultArray()]);
    }

    public function operations()
    {
        $rows = db_connect()->table('warehouse_operations wo')
            ->select('wo.*, p.name as product_name, w.name as warehouse_name, tw.name as target_warehouse_name')
            ->join('products p', 'p.id = wo.product_id', 'left')
            ->join('warehouses w', 'w.id = wo.warehouse_id', 'left')
            ->join('warehouses tw', 'tw.id = wo.target_warehouse_id', 'left')
            ->orderBy('wo.created_at', 'DESC')
            ->limit(100)
            ->get()->getResultArray();
        return $this->ok(['operations' => $rows]);
    }

    public function createOperation()
    {
        $jwt = $this->jwtUser();
        $body = $this->request->getJSON(true) ?? [];
        $type = $body['type'] ?? '';
        $warehouseId = (int) ($body['warehouse_id'] ?? 0);
        $productId = (int) ($body['product_id'] ?? 0);
        $qty = (float) ($body['quantity'] ?? 0);
        $cost = (float) ($body['cost'] ?? 0);

        if (!$warehouseId || !$productId || $qty <= 0) {
            return $this->err('Невірні дані операції');
        }

        $stock = new StockService();
        $db = db_connect();

        try {
            switch ($type) {
                case 'receipt':
                case 'purchase':
                    $stock->adjust($warehouseId, $productId, $qty);
                    if ($cost > 0) {
                        $db->table('products')->where('id', $productId)->update(['cost_price' => $cost]);
                    }
                    $delta = $qty;
                    break;
                case 'writeoff':
                    $stock->adjust($warehouseId, $productId, -$qty);
                    $delta = $qty;
                    break;
                case 'adjustment':
                    $row = $db->table('stock')->where(['warehouse_id' => $warehouseId, 'product_id' => $productId])->get()->getRowArray();
                    $current = (float) ($row['quantity'] ?? 0);
                    $stock->adjust($warehouseId, $productId, $qty - $current);
                    $delta = abs($qty - $current);
                    break;
                case 'transfer':
                    $targetId = (int) ($body['target_warehouse_id'] ?? 0);
                    if (!$targetId || $targetId === $warehouseId) {
                        return $this->err('Оберіть цільовий склад');
                    }
                    $stock->adjust($warehouseId, $productId, -$qty);
                    $stock->adjust($targetId, $productId, $qty);
                    $stock->logOperation([
                        'type' => 'transfer_out', 'warehouse_id' => $warehouseId,
                        'target_warehouse_id' => $targetId, 'product_id' => $productId,
                        'quantity' => $qty, 'user_id' => $jwt['sub'] ?? null,
                        'notes' => $body['notes'] ?? null,
                    ]);
                    $id = $stock->logOperation([
                        'type' => 'transfer_in', 'warehouse_id' => $targetId,
                        'target_warehouse_id' => $warehouseId, 'product_id' => $productId,
                        'quantity' => $qty, 'user_id' => $jwt['sub'] ?? null,
                        'notes' => $body['notes'] ?? null,
                    ]);
                    return $this->ok(['id' => $id], 201);
                default:
                    return $this->err('Невідомий тип операції');
            }

            $id = $stock->logOperation([
                'type' => $type,
                'warehouse_id' => $warehouseId,
                'supplier_id' => $body['supplier_id'] ?? null,
                'product_id' => $productId,
                'quantity' => abs($delta ?? $qty),
                'cost' => $cost,
                'notes' => $body['notes'] ?? null,
                'user_id' => $jwt['sub'] ?? null,
            ]);

            return $this->ok(['id' => $id], 201);
        } catch (\RuntimeException $e) {
            return $this->err($e->getMessage());
        }
    }

    public function report()
    {
        $series = db_connect()->query("
            SELECT wo.type, COUNT(*) as count, SUM(wo.quantity) as qty
            FROM warehouse_operations wo
            WHERE datetime(wo.created_at) >= datetime('now', '-30 days')
            GROUP BY wo.type
        ")->getResultArray();
        return $this->ok(['series' => $series]);
    }
}
