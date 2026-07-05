<?php

namespace App\Controllers\Api;

class DashboardController extends BaseApiController
{
    public function overview()
    {
        $db = db_connect();
        $today = date('Y-m-d');

        $salesToday = $db->query(
            "SELECT COALESCE(SUM(total),0) as v, COUNT(*) as c FROM sales WHERE status='completed' AND date(created_at)=?",
            [$today]
        )->getRowArray();

        $profitToday = $db->query("
            SELECT COALESCE(SUM(si.total - si.quantity * p.cost_price), 0) as v
            FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
            WHERE s.status='completed' AND date(s.created_at)=?
        ", [$today])->getRow('v');

        $stockVal = $db->query("
            SELECT
              COALESCE(SUM(st.quantity * COALESCE(NULLIF(p.sale_price,0), p.retail_price, 0)), 0) as retail_value,
              COALESCE(SUM(st.quantity * COALESCE(p.cost_price, 0)), 0) as cost_value,
              COALESCE(SUM(st.quantity), 0) as total_qty
            FROM stock st JOIN products p ON p.id = st.product_id WHERE p.active = 1
        ")->getRowArray();

        return $this->ok([
            'salesToday' => (float) $salesToday['v'],
            'salesCountToday' => (int) $salesToday['c'],
            'profitToday' => (float) $profitToday,
            'productsCount' => $db->table('products')->where('active', 1)->countAllResults(),
            'customersCount' => $db->table('customers')->countAllResults(),
            'lowStockCount' => (int) $db->query("SELECT COUNT(*) as c FROM stock st JOIN products p ON p.id=st.product_id WHERE st.quantity <= 5 AND p.active=1")->getRow('c'),
            'openShift' => $db->table('shifts')->where('status', 'open')->get()->getRowArray(),
            'totalDebt' => (float) $db->table('customers')->selectSum('debt')->get()->getRow('debt'),
            'retail_value' => (float) ($stockVal['retail_value'] ?? 0),
            'cost_value' => (float) ($stockVal['cost_value'] ?? 0),
            'total_qty' => (float) ($stockVal['total_qty'] ?? 0),
        ]);
    }

    public function salesChart()
    {
        $days = min(90, max(7, (int) ($this->request->getGet('days') ?? 30)));
        $series = db_connect()->query("
            SELECT date(created_at) as date, SUM(total) as amount, COUNT(*) as count
            FROM sales WHERE status='completed' AND datetime(created_at) >= datetime('now', '-' || ? || ' days')
            GROUP BY date(created_at) ORDER BY date
        ", [$days])->getResultArray();
        return $this->ok(compact('days', 'series'));
    }
}
