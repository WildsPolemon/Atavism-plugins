<?php

namespace App\Controllers\Api;

class ReportController extends BaseApiController
{
    public function sales()
    {
        $series = db_connect()->query("
            SELECT date(created_at) as date, COUNT(*) as count, SUM(total) as revenue
            FROM sales WHERE status='completed' AND datetime(created_at) >= datetime('now', '-30 days')
            GROUP BY date(created_at) ORDER BY date
        ")->getResultArray();
        return $this->ok(['series' => $series]);
    }

    public function finance()
    {
        $db = db_connect();
        return $this->ok([
            'cash' => (float) $db->table('sales')->selectSum('payment_cash')->where('status', 'completed')->get()->getRow('payment_cash'),
            'card' => (float) $db->table('sales')->selectSum('payment_card')->where('status', 'completed')->get()->getRow('payment_card'),
            'debt' => (float) $db->table('customers')->selectSum('debt')->get()->getRow('debt'),
        ]);
    }

    public function profit()
    {
        $days = (int) ($this->request->getGet('days') ?? 30);
        $series = db_connect()->query("
            SELECT date(s.created_at) as date,
              SUM(si.total) as revenue,
              SUM(si.quantity * p.cost_price) as cost,
              SUM(si.total - si.quantity * p.cost_price) as profit
            FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
            WHERE s.status='completed' AND datetime(s.created_at) >= datetime('now', '-' || ? || ' days')
            GROUP BY date(s.created_at) ORDER BY date
        ", [$days])->getResultArray();
        return $this->ok(compact('days', 'series'));
    }

    public function employees()
    {
        $days = (int) ($this->request->getGet('days') ?? 30);
        $rows = db_connect()->query("
            SELECT u.name, COUNT(s.id) as sales_count, COALESCE(SUM(s.total),0) as revenue
            FROM users u LEFT JOIN sales s ON s.user_id=u.id AND s.status='completed'
              AND datetime(s.created_at) >= datetime('now', '-' || ? || ' days')
            GROUP BY u.id ORDER BY revenue DESC
        ", [$days])->getResultArray();
        return $this->ok(compact('days', 'employees' => $rows));
    }

    public function topProducts()
    {
        $limit = max(1, min(50, (int) ($this->request->getGet('limit') ?? 10)));
        $days = (int) ($this->request->getGet('days') ?? 30);
        $products = db_connect()->query("
            SELECT p.id, p.name, p.image_url, SUM(si.quantity) as qty, SUM(si.total) as revenue
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            JOIN products p ON p.id = si.product_id
            WHERE s.status = 'completed'
              AND datetime(s.created_at) >= datetime('now', '-' || ? || ' days')
            GROUP BY p.id
            ORDER BY qty DESC
            LIMIT ?
        ", [$days, $limit])->getResultArray();
        return $this->ok(compact('products'));
    }
}
