<?php

namespace App\Controllers\Api;

use App\Libraries\FinanceService;

class ShiftController extends BaseApiController
{
    public function index()
    {
        $status = $this->request->getGet('status');
        $registerId = $this->request->getGet('register_id');
        $limit = min(100, max(1, (int) ($this->request->getGet('limit') ?? 50)));
        $b = db_connect()->table('shifts s')
            ->select('s.*, u.name as cashier, r.name as register_name, r.code as register_code, st.name as store_name')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->join('cash_registers r', 'r.id = s.register_id', 'left')
            ->join('stores st', 'st.id = r.store_id', 'left')
            ->orderBy('s.opened_at', 'DESC')
            ->limit($limit);
        if ($status) $b->where('s.status', $status);
        if ($registerId) $b->where('s.register_id', (int) $registerId);
        $shifts = $b->get()->getResultArray();
        foreach ($shifts as &$s) {
            $s['sales_count'] = (int) db_connect()->table('sales')
                ->where('shift_id', $s['id'])->where('status', 'completed')->countAllResults();
        }
        return $this->ok(['shifts' => $shifts]);
    }

    public function show(int $id)
    {
        $shift = $this->shiftDetail($id);
        if (!$shift) return $this->err('Зміну не знайдено', 404);
        return $this->ok($shift);
    }

    public function xzReport(int $id)
    {
        $shift = db_connect()->table('shifts')->where('id', $id)->get()->getRowArray();
        if (!$shift) return $this->err('Зміну не знайдено', 404);
        $type = $this->request->getGet('type') ?? 'X';
        if ($type === 'Z' && $shift['status'] !== 'closed') {
            return $this->err('Z-звіт доступний лише для закритих змін');
        }
        $detail = $this->shiftDetail($id);
        return $this->ok(['shift' => $detail, 'sales' => $detail['sales'], 'type' => $type]);
    }

    public function myRegisters()
    {
        $jwt = service('jwtauth')->userFromRequest();
        $userId = (int) $jwt['sub'];
        $db = db_connect();
        $user = $db->table('users')->where('id', $userId)->get()->getRowArray();
        $b = $db->table('cash_registers r')
            ->select('r.*, s.name as store_name, fa.balance as account_balance')
            ->join('stores s', 's.id = r.store_id', 'left')
            ->join('finance_accounts fa', 'fa.id = r.account_id', 'left')
            ->where('r.active', 1);
        if (($user['role'] ?? '') !== 'admin') {
            $b->join('register_users ru', 'ru.register_id = r.id')->where('ru.user_id', $userId);
        }
        $regs = $b->orderBy('r.name')->get()->getResultArray();
        foreach ($regs as &$r) {
            $r['cashiers'] = $this->registerCashiers((int) $r['id']);
            $r['open_shift'] = $db->table('shifts')->where('register_id', $r['id'])->where('status', 'open')->get()->getRowArray();
        }
        return $this->ok(['registers' => $regs]);
    }

    public function registers()
    {
        $db = db_connect();
        $regs = $db->table('cash_registers r')
            ->select('r.*, s.name as store_name, fa.balance as account_balance')
            ->join('stores s', 's.id = r.store_id', 'left')
            ->join('finance_accounts fa', 'fa.id = r.account_id', 'left')
            ->orderBy('r.name')->get()->getResultArray();
        $totalBalance = 0;
        foreach ($regs as &$r) {
            $r['cashiers'] = $this->registerCashiers((int) $r['id']);
            $r['open_shift'] = $db->table('shifts')->where('register_id', $r['id'])->where('status', 'open')->get()->getRowArray();
            $bal = (float) ($r['account_balance'] ?? $r['balance'] ?? 0);
            $r['balance'] = $bal;
            $totalBalance += $bal;
        }
        return $this->ok(['registers' => $regs, 'total_balance' => $totalBalance]);
    }

    public function showRegister(int $id)
    {
        $db = db_connect();
        $r = $db->table('cash_registers r')
            ->select('r.*, s.name as store_name, fa.balance as account_balance')
            ->join('stores s', 's.id = r.store_id', 'left')
            ->join('finance_accounts fa', 'fa.id = r.account_id', 'left')
            ->where('r.id', $id)->get()->getRowArray();
        if (!$r) return $this->err('Касу не знайдено', 404);
        $r['cashiers'] = $this->registerCashiers($id);
        $r['balance'] = (float) ($r['account_balance'] ?? $r['balance'] ?? 0);
        $r['movements'] = $db->table('money_movements m')
            ->select('m.*, u.name as user_name, fa1.name as from_name, fa2.name as to_name')
            ->join('users u', 'u.id = m.user_id', 'left')
            ->join('finance_accounts fa1', 'fa1.id = m.from_account_id', 'left')
            ->join('finance_accounts fa2', 'fa2.id = m.to_account_id', 'left')
            ->groupStart()
                ->where('m.register_id', $id)
                ->orWhere('m.from_account_id', $r['account_id'])
                ->orWhere('m.to_account_id', $r['account_id'])
            ->groupEnd()
            ->orderBy('m.created_at', 'DESC')->limit(50)->get()->getResultArray();
        $r['shifts'] = $db->table('shifts s')
            ->select('s.*, u.name as cashier')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->where('s.register_id', $id)->orderBy('s.opened_at', 'DESC')->limit(20)->get()->getResultArray();
        return $this->ok($r);
    }

    public function createRegister()
    {
        $body = $this->request->getJSON(true) ?? [];
        if (empty($body['name'])) return $this->err('Вкажіть назву каси');
        $db = db_connect();
        $storeId = (int) ($body['store_id'] ?? $db->table('stores')->limit(1)->get()->getRow('id') ?? 0);
        $balance = (float) ($body['balance'] ?? 0);
        $count = $db->table('cash_registers')->countAllResults();
        $code = 'N' . ($count + 1);
        $id = $db->table('cash_registers')->insert([
            'name' => $body['name'],
            'code' => $code,
            'store_id' => $storeId ?: null,
            'terminal_info' => $body['terminal_info'] ?? 'Каса',
            'balance' => $balance,
            'active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        $accountId = (new FinanceService())->createCashAccount((int) $id, $body['name'], $storeId, $balance);
        if (!empty($body['user_ids'])) {
            $this->syncCashiers((int) $id, $body['user_ids']);
        }
        return $this->ok($this->registerRow((int) $id), 201);
    }

    public function updateRegister(int $id)
    {
        $body = $this->request->getJSON(true) ?? [];
        $db = db_connect();
        $reg = $db->table('cash_registers')->where('id', $id)->get()->getRowArray();
        if (!$reg) return $this->err('Касу не знайдено', 404);
        $data = array_intersect_key($body, array_flip(['name', 'store_id', 'terminal_info', 'active']));
        if ($data) $db->table('cash_registers')->where('id', $id)->update($data);
        if (isset($body['user_ids'])) $this->syncCashiers($id, $body['user_ids']);
        if (!empty($data['name']) && $reg['account_id']) {
            $db->table('finance_accounts')->where('id', $reg['account_id'])->update(['name' => $data['name']]);
        }
        return $this->ok($this->registerRow($id));
    }

    public function users()
    {
        $users = db_connect()->table('users')->where('active', 1)->orderBy('name')->get()->getResultArray();
        return $this->ok(['users' => $users]);
    }

    protected function shiftDetail(int $id): ?array
    {
        $shift = db_connect()->table('shifts s')
            ->select('s.*, u.name as cashier, r.name as register_name, r.code as register_code, st.name as store_name')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->join('cash_registers r', 'r.id = s.register_id', 'left')
            ->join('stores st', 'st.id = r.store_id', 'left')
            ->where('s.id', $id)->get()->getRowArray();
        if (!$shift) return null;
        $shift['sales'] = db_connect()->query("
            SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total,
              COALESCE(SUM(payment_cash),0) as cash, COALESCE(SUM(payment_card),0) as card,
              COALESCE(SUM(payment_deferred),0) as deferred
            FROM sales WHERE shift_id=? AND status='completed'
        ", [$id])->getRowArray();
        return $shift;
    }

    protected function registerCashiers(int $registerId): array
    {
        return db_connect()->table('register_users ru')
            ->select('u.id, u.name, u.email')
            ->join('users u', 'u.id = ru.user_id')
            ->where('ru.register_id', $registerId)->get()->getResultArray();
    }

    protected function syncCashiers(int $registerId, array $userIds): void
    {
        $db = db_connect();
        $db->table('register_users')->where('register_id', $registerId)->delete();
        foreach (array_unique(array_map('intval', $userIds)) as $uid) {
            if ($uid > 0) $db->table('register_users')->insert(['register_id' => $registerId, 'user_id' => $uid]);
        }
    }

    protected function registerRow(int $id): ?array
    {
        $r = db_connect()->table('cash_registers r')
            ->select('r.*, s.name as store_name, fa.balance as account_balance')
            ->join('stores s', 's.id = r.store_id', 'left')
            ->join('finance_accounts fa', 'fa.id = r.account_id', 'left')
            ->where('r.id', $id)->get()->getRowArray();
        if ($r) {
            $r['cashiers'] = $this->registerCashiers($id);
            $r['balance'] = (float) ($r['account_balance'] ?? $r['balance'] ?? 0);
        }
        return $r;
    }
}
