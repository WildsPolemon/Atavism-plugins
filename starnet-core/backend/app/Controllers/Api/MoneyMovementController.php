<?php

namespace App\Controllers\Api;

use App\Libraries\FinanceService;

class MoneyMovementController extends BaseApiController
{
    public function accounts()
    {
        $db = db_connect();
        $accounts = $db->table('finance_accounts fa')
            ->select('fa.*, s.name as store_name, r.code as register_code')
            ->join('stores s', 's.id = fa.store_id', 'left')
            ->join('cash_registers r', 'r.id = fa.register_id', 'left')
            ->where('fa.active', 1)
            ->orderBy('fa.type')->orderBy('fa.name')
            ->get()->getResultArray();
        $grouped = ['store' => [], 'cash' => [], 'bank' => []];
        $total = 0;
        foreach ($accounts as $a) {
            $t = $a['type'] ?? 'store';
            if (!isset($grouped[$t])) $grouped[$t] = [];
            $grouped[$t][] = $a;
            $total += (float) $a['balance'];
        }
        return $this->ok(['accounts' => $accounts, 'grouped' => $grouped, 'total_balance' => $total]);
    }

    public function createAccount()
    {
        $body = $this->request->getJSON(true) ?? [];
        $type = $body['type'] ?? '';
        if (!in_array($type, ['store', 'bank'], true) || empty($body['name'])) {
            return $this->err('Вкажіть тип (store/bank) та назву');
        }
        $id = db_connect()->table('finance_accounts')->insert([
            'name' => $body['name'],
            'type' => $type,
            'store_id' => $body['store_id'] ?? null,
            'balance' => (float) ($body['balance'] ?? 0),
            'bank_details' => $body['bank_details'] ?? null,
            'active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->ok(db_connect()->table('finance_accounts')->where('id', $id)->get()->getRowArray(), 201);
    }

    public function index()
    {
        $from = $this->request->getGet('from');
        $to = $this->request->getGet('to');
        $accountId = $this->request->getGet('account_id');
        $b = db_connect()->table('money_movements m')
            ->select('m.*, u.name as user_name, c.name as customer_name, fa1.name as from_account_name, fa2.name as to_account_name, r.name as register_name')
            ->join('users u', 'u.id = m.user_id', 'left')
            ->join('customers c', 'c.id = m.customer_id', 'left')
            ->join('finance_accounts fa1', 'fa1.id = m.from_account_id', 'left')
            ->join('finance_accounts fa2', 'fa2.id = m.to_account_id', 'left')
            ->join('cash_registers r', 'r.id = m.register_id', 'left')
            ->orderBy('m.created_at', 'DESC')->limit(200);
        if ($from) $b->where('m.created_at >=', $from);
        if ($to) $b->where('m.created_at <=', $to . ' 23:59:59');
        if ($accountId) {
            $aid = (int) $accountId;
            $b->groupStart()->where('m.from_account_id', $aid)->orWhere('m.to_account_id', $aid)->groupEnd();
        }
        $movements = $b->get()->getResultArray();
        $income = 0;
        $expense = 0;
        foreach ($movements as $m) {
            if (in_array($m['type'], ['income', 'debt_payment', 'sale_cash'], true)) $income += (float) $m['amount'];
            elseif (in_array($m['type'], ['expense', 'transfer'], true) && $m['from_account_id']) $expense += (float) $m['amount'];
        }
        return $this->ok(['movements' => $movements, 'summary' => ['income' => $income, 'expense' => $expense]]);
    }

    public function create()
    {
        $jwt = service('jwtauth')->userFromRequest();
        $body = $this->request->getJSON(true) ?? [];
        $type = $body['type'] ?? '';
        $amount = (float) ($body['amount'] ?? 0);
        if (!in_array($type, ['income', 'expense', 'transfer'], true) || $amount <= 0) {
            return $this->err('Невірні дані операції');
        }
        try {
            $id = (new FinanceService())->record((int) $jwt['sub'], [
                'type' => $type,
                'amount' => $amount,
                'from_account_id' => $body['from_account_id'] ?? null,
                'to_account_id' => $body['to_account_id'] ?? null,
                'category' => $body['category'] ?? null,
                'expense_category' => $body['expense_category'] ?? null,
                'notes' => $body['notes'] ?? null,
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->err($e->getMessage());
        }
        return $this->ok(db_connect()->table('money_movements')->where('id', $id)->get()->getRowArray(), 201);
    }
}
