<?php

namespace App\Controllers\Api;

use App\Libraries\CheckboxService;

class PrroController extends BaseApiController
{
    public function status()
    {
        $cb = CheckboxService::fromSettings();
        $rows = db_connect()->table('settings')->whereIn('key', ['country', 'pos_fiscal_default'])->get()->getResultArray();
        $s = [];
        foreach ($rows as $r) {
            $s[$r['key']] = $r['value'];
        }
        return $this->ok([
            'enabled' => $cb->isEnabled(),
            'provider' => 'checkbox',
            'country' => $s['country'] ?? 'UA',
            'fiscal_default' => ($s['pos_fiscal_default'] ?? '0') === '1',
        ]);
    }

    public function shiftStatus()
    {
        try {
            return $this->ok(CheckboxService::fromSettings()->shiftStatus());
        } catch (\Throwable $e) {
            return $this->err($e->getMessage());
        }
    }

    public function test()
    {
        try {
            $result = CheckboxService::fromSettings()->testConnection();
            return $this->ok($result);
        } catch (\Throwable $e) {
            return $this->err($e->getMessage());
        }
    }

    public function fiscalize(int $saleId)
    {
        $db = db_connect();
        $sale = $db->table('sales')->where('id', $saleId)->get()->getRowArray();
        if (!$sale || $sale['status'] !== 'completed') {
            return $this->err('Чек не знайдено', 404);
        }
        if (!empty($sale['is_fiscal'])) {
            return $this->ok(['fiscal_code' => $sale['fiscal_code'], 'already' => true]);
        }
        if ((float) ($sale['payment_deferred'] ?? 0) > 0) {
            return $this->err('Checkbox не підтримує продаж у борг');
        }

        $items = $db->table('sale_items si')
            ->select('si.*, p.name')
            ->join('products p', 'p.id = si.product_id', 'left')
            ->where('sale_id', $saleId)->get()->getResultArray();

        try {
            $cb = CheckboxService::fromSettings();
            $fiscal = $cb->fiscalizeSale($sale, $items, [
                'cash' => (float) $sale['payment_cash'],
                'card' => (float) $sale['payment_card'],
            ]);
            $db->table('sales')->where('id', $saleId)->update([
                'is_fiscal' => 1,
                'fiscal_code' => $fiscal['fiscal_code'],
                'fiscal_receipt_id' => $fiscal['receipt_id'],
            ]);
            return $this->ok($fiscal);
        } catch (\Throwable $e) {
            return $this->err('Checkbox: ' . $e->getMessage());
        }
    }

    public function receiptPng(int $saleId)
    {
        $sale = db_connect()->table('sales')->where('id', $saleId)->get()->getRowArray();
        if (!$sale || empty($sale['fiscal_receipt_id'])) {
            return $this->err('Фіскальний чек не знайдено', 404);
        }
        try {
            $png = CheckboxService::fromSettings()->receiptPng($sale['fiscal_receipt_id']);
            if (!$png) {
                return $this->err('Не вдалося отримати чек');
            }
            return $this->response->setHeader('Content-Type', 'image/png')->setBody($png);
        } catch (\Throwable $e) {
            return $this->err($e->getMessage());
        }
    }
}
