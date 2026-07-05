<?php

namespace App\Controllers\Api;

use App\Models\CustomerModel;

class CrmController extends BaseApiController
{
    public function customers()
    {
        $search = trim($this->request->getGet('search') ?? '');
        $m = model(CustomerModel::class);
        if ($search) {
            $m->groupStart()->like('name', $search)->orLike('phone', $search)->groupEnd();
        }
        return $this->ok(['customers' => $m->orderBy('created_at', 'DESC')->findAll(100)]);
    }

    public function createCustomer()
    {
        $body = $this->request->getJSON(true) ?? [];
        $id = model(CustomerModel::class)->insert([
            'name' => $body['name'],
            'phone' => $body['phone'] ?? '',
            'email' => $body['email'] ?? '',
            'card_number' => $body['card_number'] ?? null,
            'discount_percent' => (float) ($body['discount_percent'] ?? 0),
            'notes' => $body['notes'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->ok(model(CustomerModel::class)->find($id), 201);
    }

    public function show(int $id)
    {
        $c = model(CustomerModel::class)->find($id);
        if (!$c) return $this->err('Not found', 404);
        $purchases = db_connect()->table('sales')->where('customer_id', $id)->orderBy('created_at', 'DESC')->limit(50)->get()->getResultArray();
        return $this->ok([...$c, 'purchases' => $purchases]);
    }

    public function updateCustomer(int $id)
    {
        $body = $this->request->getJSON(true) ?? [];
        $allowed = ['name', 'phone', 'email', 'notes', 'debt', 'discount_percent', 'loyalty_points', 'card_number'];
        $data = array_intersect_key($body, array_flip($allowed));
        if (!$data) {
            return $this->err('Немає даних');
        }
        model(CustomerModel::class)->update($id, $data);
        return $this->ok(model(CustomerModel::class)->find($id));
    }

    public function debtors()
    {
        $customers = model(CustomerModel::class)->where('debt >', 0)->orderBy('debt', 'DESC')->findAll(100);
        return $this->ok(['customers' => $customers]);
    }

    public function debtPayment(int $id)
    {
        $jwt = service('jwtauth')->userFromRequest();
        $body = $this->request->getJSON(true) ?? [];
        $amount = (float) ($body['amount'] ?? 0);
        $cash = (float) ($body['payment_cash'] ?? 0);
        $card = (float) ($body['payment_card'] ?? 0);
        if ($amount <= 0 || ($cash + $card) < $amount - 0.01) {
            return $this->err('Невірна сума оплати');
        }
        $customer = model(CustomerModel::class)->find($id);
        if (!$customer) {
            return $this->err('Клієнта не знайдено', 404);
        }
        if ((float) $customer['debt'] < $amount - 0.01) {
            return $this->err('Сума більша за борг');
        }
        $db = db_connect();
        $db->transStart();
        $newDebt = max(0, (float) $customer['debt'] - $amount);
        model(CustomerModel::class)->update($id, ['debt' => $newDebt]);
        $shift = $db->table('shifts')->where('status', 'open')->where('user_id', $jwt['sub'])->get()->getRowArray()
            ?: $db->table('shifts')->where('status', 'open')->get()->getRowArray();
        $db->table('money_movements')->insert([
            'type' => 'debt_payment',
            'amount' => $amount,
            'customer_id' => $id,
            'user_id' => $jwt['sub'],
            'shift_id' => $shift['id'] ?? null,
            'notes' => $body['notes'] ?? 'Повернення боргу',
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        if ($shift && $cash > 0) {
            $db->table('shifts')->where('id', $shift['id'])->update([
                'cash_sales' => (float) $shift['cash_sales'] + $cash,
            ]);
        }
        if ($shift && $card > 0) {
            $db->table('shifts')->where('id', $shift['id'])->update([
                'card_sales' => (float) $shift['card_sales'] + $card,
            ]);
        }
        $db->transComplete();
        return $this->ok(['customer' => model(CustomerModel::class)->find($id), 'paid' => $amount]);
    }
}
