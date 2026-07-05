<?php

namespace App\Libraries;

class FinanceService
{
    protected $db;

    public function __construct()
    {
        $this->db = db_connect();
    }

    public function adjustAccount(int $accountId, float $delta): void
    {
        $this->db->query('UPDATE finance_accounts SET balance = balance + ? WHERE id = ?', [$delta, $accountId]);
        $acc = $this->db->table('finance_accounts')->where('id', $accountId)->get()->getRowArray();
        if ($acc && $acc['register_id']) {
            $this->db->table('cash_registers')->where('id', $acc['register_id'])->update(['balance' => $acc['balance']]);
        }
    }

    public function record(int $userId, array $data): int
    {
        $type = $data['type'];
        $amount = (float) $data['amount'];
        $fromId = $data['from_account_id'] ?? null;
        $toId = $data['to_account_id'] ?? null;

        $this->db->transStart();

        if ($type === 'transfer') {
            if (!$fromId || !$toId || $fromId === $toId) {
                throw new \InvalidArgumentException('Невірні рахунки для переказу');
            }
            $from = $this->db->table('finance_accounts')->where('id', $fromId)->get()->getRowArray();
            if (!$from || (float) $from['balance'] < $amount - 0.01) {
                throw new \InvalidArgumentException('Недостатньо коштів на рахунку');
            }
            $this->adjustAccount($fromId, -$amount);
            $this->adjustAccount($toId, $amount);
        } elseif ($type === 'expense') {
            $accId = $fromId ?: $toId;
            if (!$accId) {
                throw new \InvalidArgumentException('Вкажіть рахунок');
            }
            $acc = $this->db->table('finance_accounts')->where('id', $accId)->get()->getRowArray();
            if (!$acc || (float) $acc['balance'] < $amount - 0.01) {
                throw new \InvalidArgumentException('Недостатньо коштів');
            }
            $this->adjustAccount($accId, -$amount);
            $fromId = $accId;
        } elseif (in_array($type, ['income', 'debt_payment', 'sale_cash'], true)) {
            $accId = $toId ?: $fromId;
            if (!$accId) {
                throw new \InvalidArgumentException('Вкажіть рахунок');
            }
            $this->adjustAccount($accId, $amount);
            $toId = $accId;
        }

        $id = $this->db->table('money_movements')->insert([
            'type' => $type,
            'amount' => $amount,
            'from_account_id' => $fromId,
            'to_account_id' => $toId,
            'register_id' => $data['register_id'] ?? null,
            'shift_id' => $data['shift_id'] ?? null,
            'customer_id' => $data['customer_id'] ?? null,
            'user_id' => $userId,
            'category' => $data['category'] ?? null,
            'expense_category' => $data['expense_category'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        $this->db->transComplete();
        return $id;
    }

    public function createCashAccount(int $registerId, string $name, int $storeId, float $balance = 0): int
    {
        $id = $this->db->table('finance_accounts')->insert([
            'name' => $name,
            'type' => 'cash',
            'store_id' => $storeId,
            'register_id' => $registerId,
            'balance' => $balance,
            'active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        $this->db->table('cash_registers')->where('id', $registerId)->update(['account_id' => $id, 'balance' => $balance]);
        return $id;
    }
}
