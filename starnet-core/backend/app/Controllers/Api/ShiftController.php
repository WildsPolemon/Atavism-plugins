<?php

namespace App\Controllers\Api;

class ShiftController extends BaseApiController
{
    public function index()
    {
        $status = $this->request->getGet('status');
        $limit = min(100, max(1, (int) ($this->request->getGet('limit') ?? 50)));
        $b = db_connect()->table('shifts s')
            ->select('s.*, u.name as cashier, r.name as register_name')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->join('cash_registers r', 'r.id = s.register_id', 'left')
            ->orderBy('s.opened_at', 'DESC')
            ->limit($limit);
        if ($status) {
            $b->where('s.status', $status);
        }
        $shifts = $b->get()->getResultArray();
        foreach ($shifts as &$s) {
            $s['sales_count'] = (int) db_connect()->table('sales')
                ->where('shift_id', $s['id'])->where('status', 'completed')->countAllResults();
        }
        return $this->ok(['shifts' => $shifts]);
    }

    public function show(int $id)
    {
        $shift = db_connect()->table('shifts s')
            ->select('s.*, u.name as cashier, r.name as register_name')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->join('cash_registers r', 'r.id = s.register_id', 'left')
            ->where('s.id', $id)->get()->getRowArray();
        if (!$shift) {
            return $this->err('Зміну не знайдено', 404);
        }
        $sales = db_connect()->query("
            SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total,
              COALESCE(SUM(payment_cash),0) as cash, COALESCE(SUM(payment_card),0) as card,
              COALESCE(SUM(payment_deferred),0) as deferred
            FROM sales WHERE shift_id=? AND status='completed'
        ", [$id])->getRowArray();
        $shift['sales'] = $sales;
        return $this->ok($shift);
    }

    public function registers()
    {
        $regs = db_connect()->table('cash_registers r')
            ->select('r.*, s.name as store_name')
            ->join('stores s', 's.id = r.store_id', 'left')
            ->orderBy('r.name')->get()->getResultArray();
        $openShifts = db_connect()->table('shifts')->where('status', 'open')->get()->getResultArray();
        $openByReg = [];
        foreach ($openShifts as $os) {
            $openByReg[$os['register_id'] ?? 0] = $os;
        }
        $totalBalance = 0;
        foreach ($regs as &$r) {
            $r['open_shift'] = $openByReg[$r['id']] ?? null;
            $totalBalance += (float) $r['balance'];
        }
        return $this->ok(['registers' => $regs, 'total_balance' => $totalBalance]);
    }

    public function createRegister()
    {
        $body = $this->request->getJSON(true) ?? [];
        if (empty($body['name'])) {
            return $this->err('Вкажіть назву каси');
        }
        $id = db_connect()->table('cash_registers')->insert([
            'name' => $body['name'],
            'store_id' => $body['store_id'] ?? null,
            'balance' => (float) ($body['balance'] ?? 0),
            'active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->ok(db_connect()->table('cash_registers')->where('id', $id)->get()->getRowArray(), 201);
    }
}
