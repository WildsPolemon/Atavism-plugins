<?php

namespace App\Libraries;

class StockService
{
    public function adjust(int $warehouseId, int $productId, float $delta): float
    {
        $db = db_connect();
        $row = $db->table('stock')
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->get()->getRowArray();

        $newQty = (float) ($row['quantity'] ?? 0) + $delta;
        if ($newQty < 0) {
            throw new \RuntimeException('Недостатньо товару на складі');
        }

        if ($row) {
            $db->table('stock')
                ->where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->update(['quantity' => $newQty]);
        } elseif ($delta > 0) {
            $db->table('stock')->insert([
                'warehouse_id' => $warehouseId,
                'product_id' => $productId,
                'quantity' => $newQty,
            ]);
        }

        return $newQty;
    }

    public function logOperation(array $data): int
    {
        $data['created_at'] = $data['created_at'] ?? date('Y-m-d H:i:s');
        db_connect()->table('warehouse_operations')->insert($data);
        return (int) db_connect()->insertID();
    }
}
