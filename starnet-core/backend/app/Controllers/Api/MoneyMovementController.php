<?php

namespace App\Controllers\Api;

class MoneyMovementController extends BaseApiController
{
    public function index()
    {
        $from = $this->request->getGet('from');
        $to = $this->request->getGet('to');
        $b = db_connect()->table('money_movements m')
            ->select('m.*, u.name as user_name, r.name as register_name, c.name as customer_name')
            ->join('users u', 'u.id = m.user_id', 'left')
            ->join('cash_registers r', 'r.id = m.register_id', 'left')
            ->join('customers c', 'c.id = m.customer_id', 'left')
            ->orderBy('m.created_at', 'DESC')->limit(100);
        if ($from) {
            $b->where('m.created_at >=', $from);
        }
        if ($to) {
            $b->where('m.created_at <=', $to . ' 23:59:59');
        }
        $movements = $b->get()->getResultArray();
        $income = 0;
        $expense = 0;
        foreach ($movements as $m) {
            if (in_array($m['type'], ['income', 'debt_payment', 'sale_cash'], true)) {
                $income += (float) $m['amount'];
            } else {
                $expense += (float) $m['amount'];
            }
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
        $db = db_connect();
        $id = $db->table('money_movements')->insert([
            'type' => $type,
            'amount' => $amount,
            'register_id' => $body['register_id'] ?? null,
            'user_id' => $jwt['sub'],
            'category' => $body['category'] ?? null,
            'notes' => $body['notes'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        if (!empty($body['register_id'])) {
            $delta = $type === 'expense' ? -$amount : $amount;
            $db->query('UPDATE cash_registers SET balance = balance + ? WHERE id = ?', [$delta, $body['register_id']]);
        }
        return $this->ok($db->table('money_movements')->where('id', $id)->get()->getRowArray(), 201);
    }
}
