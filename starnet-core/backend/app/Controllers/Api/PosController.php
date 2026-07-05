<?php

namespace App\Controllers\Api;

use App\Libraries\StockService;
use App\Models\ProductModel;
use App\Models\SaleModel;

class PosController extends BaseApiController
{
    protected function openShift(int $userId): ?array
    {
        return db_connect()->table('shifts')->where('status', 'open')->where('user_id', $userId)->get()->getRowArray()
            ?: db_connect()->table('shifts')->where('status', 'open')->get()->getRowArray();
    }

    public function shift()
    {
        $jwt = service('jwtauth')->userFromRequest();
        return $this->ok(['shift' => $this->openShift((int) $jwt['sub'])]);
    }

    public function openShiftAction()
    {
        $jwt = service('jwtauth')->userFromRequest();
        if ($this->openShift((int) $jwt['sub'])) {
            return $this->err('Зміна вже відкрита');
        }
        $cash = (float) (($this->request->getJSON(true) ?? [])['opening_cash'] ?? 0);
        $db = db_connect();
        $register = $db->table('cash_registers')->where('active', 1)->orderBy('id')->limit(1)->get()->getRowArray();
        $id = $db->table('shifts')->insert([
            'user_id' => $jwt['sub'],
            'register_id' => $register['id'] ?? null,
            'opened_at' => date('Y-m-d H:i:s'),
            'opening_cash' => $cash,
            'status' => 'open',
        ]);
        return $this->ok(db_connect()->table('shifts')->where('id', $id)->get()->getRowArray(), 201);
    }

    public function closeShiftAction()
    {
        $jwt = service('jwtauth')->userFromRequest();
        $shift = $this->openShift((int) $jwt['sub']);
        if (!$shift) {
            return $this->err('Немає відкритої зміни');
        }
        $cash = (float) (($this->request->getJSON(true) ?? [])['closing_cash'] ?? 0);
        db_connect()->table('shifts')->where('id', $shift['id'])->update([
            'status' => 'closed',
            'closed_at' => date('Y-m-d H:i:s'),
            'closing_cash' => $cash,
        ]);
        return $this->ok(db_connect()->table('shifts')->where('id', $shift['id'])->get()->getRowArray());
    }

    public function products()
    {
        $cat = $this->request->getGet('category_id');
        $db = db_connect();
        $b = model(ProductModel::class)->where('active', 1);
        if ($cat) {
            $b->where('category_id', (int) $cat);
        }
        $products = $b->orderBy('name')->findAll(60);
        foreach ($products as &$p) {
            $stock = $db->table('stock')->selectSum('quantity')->where('product_id', $p['id'])->get()->getRow('quantity');
            $p['stock_qty'] = (float) ($stock ?? 0);
        }
        return $this->ok(['products' => $products]);
    }

    public function search()
    {
        $q = trim($this->request->getGet('q') ?? '');
        if ($q === '') {
            return $this->ok(['products' => [], 'customers' => []]);
        }
        $products = model(ProductModel::class)
            ->where('active', 1)
            ->groupStart()->like('name', $q)->orLike('sku', $q)->orLike('barcode', $q)->orLike('description', $q)->groupEnd()
            ->findAll(20);
        $customers = model(\App\Models\CustomerModel::class)
            ->groupStart()->like('name', $q)->orLike('phone', $q)->orLike('card_number', $q)->groupEnd()
            ->findAll(10);
        return $this->ok(compact('products', 'customers'));
    }

    public function recommendations()
    {
        $cartIds = array_filter(array_map('intval', explode(',', $this->request->getGet('cart_ids') ?? '')));
        $db = db_connect();
        $products = [];

        if ($cartIds) {
            $placeholders = implode(',', array_fill(0, count($cartIds), '?'));
            $rows = $db->query("
                SELECT p.id, p.name, p.sale_price, p.retail_price, p.image_url, COUNT(*) as freq
                FROM sale_items si1
                JOIN sale_items si2 ON si1.sale_id = si2.sale_id AND si1.product_id != si2.product_id
                JOIN products p ON p.id = si2.product_id AND p.active = 1
                WHERE si1.product_id IN ($placeholders) AND si2.product_id NOT IN ($placeholders)
                GROUP BY p.id ORDER BY freq DESC LIMIT 6
            ", [...$cartIds, ...$cartIds])->getResultArray();
            $products = $rows;
        }

        if (!$products) {
            $products = model(ProductModel::class)->where('active', 1)->orderBy('updated_at', 'DESC')->findAll(6);
        }

        return $this->ok(['products' => $products]);
    }

    public function sale()
    {
        $jwt = service('jwtauth')->userFromRequest();
        $body = $this->request->getJSON(true) ?? [];
        $items = $body['items'] ?? [];
        if (!$items) {
            return $this->err('Порожній чек');
        }

        $shift = $this->openShift((int) $jwt['sub']);
        $db = db_connect();
        $db->transStart();

        $subtotal = 0;
        $lineItems = [];
        foreach ($items as $it) {
            $p = model(ProductModel::class)->find($it['product_id']);
            $price = $it['price'] ?? ($p['sale_price'] ?: $p['retail_price']);
            $qty = $it['quantity'] ?? 1;
            $disc = $it['discount'] ?? 0;
            $total = $price * $qty - $disc;
            $subtotal += $total;
            $lineItems[] = compact('p', 'price', 'qty', 'disc', 'total') + ['product_id' => $p['id']];
        }

        $discount = (float) ($body['discount'] ?? 0);
        if (!empty($body['customer_id'])) {
            $customer = $db->table('customers')->where('id', $body['customer_id'])->get()->getRowArray();
            if ($customer && $customer['discount_percent'] > 0) {
                $discount += $subtotal * ((float) $customer['discount_percent'] / 100);
            }
        }
        $total = max(0, $subtotal - $discount);
        $cash = (float) ($body['payment_cash'] ?? 0);
        $card = (float) ($body['payment_card'] ?? 0);
        $deferred = (float) ($body['payment_deferred'] ?? 0);
        $status = ($body['status'] ?? '') === 'held' ? 'held' : 'completed';

        if ($status === 'completed' && $deferred > 0 && empty($body['customer_id'])) {
            return $this->err('Для відстрочення потрібен клієнт');
        }
        if ($status === 'completed' && ($cash + $card + $deferred) < $total - 0.01) {
            return $this->err('Недостатньо коштів для оплати');
        }

        $saleId = model(SaleModel::class)->insert([
            'shift_id' => $shift['id'] ?? null,
            'customer_id' => $body['customer_id'] ?? null,
            'user_id' => $jwt['sub'],
            'status' => $status,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'payment_cash' => $cash,
            'payment_card' => $card,
            'payment_deferred' => $deferred,
            'notes' => $body['notes'] ?? null,
            'receipt_email' => $body['receipt_email'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        foreach ($lineItems as $li) {
            $db->table('sale_items')->insert([
                'sale_id' => $saleId,
                'product_id' => $li['product_id'],
                'quantity' => $li['qty'],
                'price' => $li['price'],
                'discount' => $li['disc'],
                'total' => $li['total'],
            ]);
            if ($status === 'completed' && $shift) {
                $wh = (int) ($db->table('warehouses')->limit(1)->get()->getRow('id') ?? 0);
                if ($wh) {
                    (new StockService())->adjust($wh, (int) $li['product_id'], -(float) $li['qty']);
                }
            }
        }

        if ($status === 'completed' && !empty($body['customer_id'])) {
            $db->query('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?', [floor($total / 10), $body['customer_id']]);
            if ($deferred > 0) {
                $db->query('UPDATE customers SET debt = debt + ? WHERE id = ?', [$deferred, $body['customer_id']]);
            }
        }

        if ($shift && $status === 'completed') {
            $db->table('shifts')->where('id', $shift['id'])->update([
                'cash_sales' => (float) $shift['cash_sales'] + $cash,
                'card_sales' => (float) $shift['card_sales'] + $card,
            ]);
        }

        $db->transComplete();
        return $this->ok(model(SaleModel::class)->find($saleId), 201);
    }

    public function sales()
    {
        $status = $this->request->getGet('status') ?? '';
        $b = db_connect()->table('sales s')
            ->select('s.*, u.name as cashier')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->orderBy('s.created_at', 'DESC')->limit(50);
        if ($status) $b->where('s.status', $status);
        return $this->ok(['sales' => $b->get()->getResultArray()]);
    }

    public function heldSales()
    {
        $sales = db_connect()->table('sales')->where('status', 'held')->orderBy('created_at', 'DESC')->get()->getResultArray();
        $db = db_connect();
        foreach ($sales as &$sale) {
            $sale['items'] = $db->table('sale_items si')
                ->select('si.product_id, si.quantity as qty, si.price, p.name, p.image_url')
                ->join('products p', 'p.id = si.product_id', 'left')
                ->where('sale_id', $sale['id'])
                ->get()->getResultArray();
        }
        return $this->ok(['sales' => $sales]);
    }

    public function cancelHeld(int $id)
    {
        $sale = model(SaleModel::class)->find($id);
        if (!$sale || $sale['status'] !== 'held') {
            return $this->err('Чек не знайдено', 404);
        }
        db_connect()->table('sale_items')->where('sale_id', $id)->delete();
        model(SaleModel::class)->delete($id);
        return $this->ok(['ok' => true]);
    }

    public function returnSale(int $id)
    {
        $sale = model(SaleModel::class)->find($id);
        if (!$sale || $sale['status'] === 'returned') {
            return $this->err('Чек не знайдено', 400);
        }

        $db = db_connect();
        $items = $db->table('sale_items')->where('sale_id', $id)->get()->getResultArray();
        $wh = (int) ($db->table('warehouses')->limit(1)->get()->getRow('id') ?? 0);
        $stock = new StockService();

        foreach ($items as $it) {
            if ($wh) {
                $stock->adjust($wh, (int) $it['product_id'], (float) $it['quantity']);
            }
        }

        if ($sale['shift_id']) {
            $db->table('shifts')->where('id', $sale['shift_id'])->update([
                'cash_sales' => max(0, (float) $db->table('shifts')->where('id', $sale['shift_id'])->get()->getRow('cash_sales') - (float) $sale['payment_cash']),
                'card_sales' => max(0, (float) $db->table('shifts')->where('id', $sale['shift_id'])->get()->getRow('card_sales') - (float) $sale['payment_card']),
            ]);
        }

        if (!empty($sale['customer_id']) && (float) ($sale['payment_deferred'] ?? 0) > 0) {
            $cust = $db->table('customers')->where('id', $sale['customer_id'])->get()->getRowArray();
            if ($cust) {
                $db->table('customers')->where('id', $sale['customer_id'])->update([
                    'debt' => max(0, (float) $cust['debt'] - (float) $sale['payment_deferred']),
                ]);
            }
        }

        model(SaleModel::class)->update($id, ['status' => 'returned']);
        return $this->ok(['ok' => true]);
    }

    public function receiptSettings()
    {
        $rows = db_connect()->table('settings')->get()->getResultArray();
        $out = [];
        foreach ($rows as $r) {
            $out[$r['key']] = $r['value'];
        }
        return $this->ok(['settings' => $out]);
    }

    public function xzReport()
    {
        $jwt = service('jwtauth')->userFromRequest();
        $shift = $this->openShift((int) $jwt['sub']);
        if (!$shift) return $this->err('Немає відкритої зміни');
        $db = db_connect();
        $shiftFull = $db->table('shifts s')
            ->select('s.*, u.name as cashier, r.name as register_name')
            ->join('users u', 'u.id = s.user_id', 'left')
            ->join('cash_registers r', 'r.id = s.register_id', 'left')
            ->where('s.id', $shift['id'])->get()->getRowArray();
        $sales = $db->query("
            SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total,
              COALESCE(SUM(payment_cash),0) as cash, COALESCE(SUM(payment_card),0) as card,
              COALESCE(SUM(payment_deferred),0) as deferred
            FROM sales WHERE shift_id=? AND status='completed'
        ", [$shift['id']])->getRowArray();
        return $this->ok(['shift' => $shiftFull, 'sales' => $sales, 'type' => $this->request->getGet('type') ?? 'X']);
    }
}
