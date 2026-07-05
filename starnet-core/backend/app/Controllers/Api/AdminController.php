<?php

namespace App\Controllers\Api;

class AdminController extends BaseApiController
{
    public function shifts()
    {
        $db = db_connect();
        $rows = $db->table('shifts s')
            ->select('s.*, u.name as cashier_name, u.email as cashier_email')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->orderBy('s.opened_at', 'DESC')
            ->limit(100)
            ->get()->getResultArray();

        foreach ($rows as &$row) {
            $stats = $db->query("
                SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total,
                  COALESCE(SUM(payment_cash),0) as cash, COALESCE(SUM(payment_card),0) as card
                FROM sales WHERE shift_id=? AND status='completed'
            ", [$row['id']])->getRowArray();
            $row['sales_count'] = (int) ($stats['count'] ?? 0);
            $row['sales_total'] = (float) ($stats['total'] ?? 0);
            $row['sales_cash'] = (float) ($stats['cash'] ?? 0);
            $row['sales_card'] = (float) ($stats['card'] ?? 0);
            $row['expected_cash'] = (float) $row['opening_cash'] + (float) $row['cash_sales'];
        }
        return $this->ok(['shifts' => $rows]);
    }

    public function shiftDetail(int $id)
    {
        $db = db_connect();
        $shift = $db->table('shifts s')
            ->select('s.*, u.name as cashier_name')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->where('s.id', $id)
            ->get()->getRowArray();
        if (!$shift) {
            return $this->err('Зміну не знайдено', 404);
        }
        $sales = $db->table('sales')->where('shift_id', $id)->orderBy('created_at', 'DESC')->limit(50)->get()->getResultArray();
        return $this->ok(['shift' => $shift, 'sales' => $sales]);
    }

    public function registers()
    {
        $db = db_connect();
        $regs = $db->table('cash_registers')->orderBy('id')->get()->getResultArray();
        foreach ($regs as &$r) {
            $open = $db->table('shifts')->where('status', 'open')->orderBy('opened_at', 'DESC')->get()->getRowArray();
            $r['balance'] = $open
                ? (float) $open['opening_cash'] + (float) $open['cash_sales']
                : 0;
            $r['open_shift_id'] = $open['id'] ?? null;
        }
        $total = array_sum(array_column($regs, 'balance'));
        return $this->ok(['registers' => $regs, 'total_balance' => $total]);
    }

    public function createRegister()
    {
        $body = $this->request->getJSON(true) ?? [];
        $name = trim($body['name'] ?? '');
        if ($name === '') {
            return $this->err('Вкажіть назву каси');
        }
        $id = db_connect()->table('cash_registers')->insert([
            'name' => $name,
            'store_name' => trim($body['store_name'] ?? '') ?: null,
            'notes' => trim($body['notes'] ?? '') ?: null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        $row = db_connect()->table('cash_registers')->where('id', $id)->get()->getRowArray();
        return $this->ok($row, 201);
    }

    public function moneyFlow()
    {
        $db = db_connect();
        $days = min(90, max(7, (int) ($this->request->getGet('days') ?? 30)));

        $summary = $db->query("
            SELECT
              COALESCE(SUM(payment_cash),0) as cash,
              COALESCE(SUM(payment_card),0) as card,
              COALESCE(SUM(payment_deferred),0) as deferred,
              COALESCE(SUM(total),0) as total,
              COUNT(*) as count
            FROM sales WHERE status='completed'
              AND datetime(created_at) >= datetime('now', '-' || ? || ' days')
        ", [$days])->getRowArray();

        $daily = $db->query("
            SELECT date(created_at) as date,
              COALESCE(SUM(payment_cash),0) as cash,
              COALESCE(SUM(payment_card),0) as card,
              COALESCE(SUM(total),0) as total
            FROM sales WHERE status='completed'
              AND datetime(created_at) >= datetime('now', '-' || ? || ' days')
            GROUP BY date(created_at) ORDER BY date DESC LIMIT 30
        ", [$days])->getResultArray();

        $supplierDebt = (float) $db->table('suppliers')->selectSum('debt')->get()->getRow('debt');
        $customerDebt = (float) $db->table('customers')->selectSum('debt')->get()->getRow('debt');

        $recentSales = $db->table('sales s')
            ->select('s.id, s.created_at, s.total, s.payment_cash, s.payment_card, s.payment_deferred, u.name as cashier')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->where('s.status', 'completed')
            ->orderBy('s.created_at', 'DESC')
            ->limit(30)
            ->get()->getResultArray();

        return $this->ok([
            'days' => $days,
            'summary' => $summary,
            'daily' => $daily,
            'supplier_debt' => $supplierDebt,
            'customer_debt' => $customerDebt,
            'recent_sales' => $recentSales,
        ]);
    }

    public function users()
    {
        $users = db_connect()->table('users')
            ->select('id, name, email, role, active, created_at')
            ->orderBy('name')
            ->get()->getResultArray();
        return $this->ok(['users' => $users]);
    }
}
