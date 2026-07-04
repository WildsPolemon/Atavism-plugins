<?php

namespace App\Controllers\Api;

class WarehouseController extends BaseApiController
{
    public function stock()
    {
        $wid = $this->request->getGet('warehouse_id');
        $db = db_connect();
        $b = $db->table('stock st')
            ->select('st.*, p.name, p.sku, p.barcode, p.retail_price, w.name as warehouse_name')
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
}
