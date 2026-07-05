<?php

namespace App\Libraries;

/**
 * Checkbox.ua PRRO API — як AinurPOS (інтеграція CheckBox v1).
 * @see https://wiki.checkbox.ua/
 */
class CheckboxService
{
    protected string $baseUrl = 'https://api.checkbox.ua/api/v1';
    protected ?string $token = null;

    public function __construct(protected array $settings = [])
    {
        if (!empty($settings['checkbox_api_url'])) {
            $this->baseUrl = rtrim($settings['checkbox_api_url'], '/');
        }
    }

    public static function fromSettings(): self
    {
        $rows = db_connect()->table('settings')->get()->getResultArray();
        $s = [];
        foreach ($rows as $r) {
            $s[$r['key']] = $r['value'];
        }
        return new self($s);
    }

    public function isEnabled(): bool
    {
        return ($this->settings['prro_enabled'] ?? '0') === '1'
            && !empty($this->settings['checkbox_license_key'])
            && !empty($this->settings['checkbox_login']);
    }

    public function signIn(): array
    {
        $res = $this->request('POST', '/cashier/signin', [
            'login' => $this->settings['checkbox_login'] ?? '',
            'password' => $this->settings['checkbox_password'] ?? '',
        ], false);
        $this->token = $res['access_token'] ?? null;
        if (!$this->token) {
            throw new \RuntimeException($res['message'] ?? 'Не вдалося авторизуватись в Checkbox');
        }
        return $res;
    }

    public function testConnection(): array
    {
        $this->signIn();
        $shift = $this->getCashierShift();
        return [
            'ok' => true,
            'message' => 'Підключено до Checkbox',
            'shift_open' => $this->isShiftOpen($shift),
            'shift' => $this->shiftSummary($shift),
            'cashier' => $shift['cashier']['full_name'] ?? ($this->settings['checkbox_login'] ?? ''),
        ];
    }

    public function getCashierShift(): array
    {
        if (!$this->token) {
            $this->signIn();
        }
        return $this->request('GET', '/cashier/shift');
    }

    public function shiftStatus(): array
    {
        if (!$this->isEnabled()) {
            return ['enabled' => false, 'shift_open' => false];
        }
        $this->signIn();
        $shift = $this->getCashierShift();
        return [
            'enabled' => true,
            'shift_open' => $this->isShiftOpen($shift),
            'shift' => $this->shiftSummary($shift),
        ];
    }

    /** Відкрити зміну Checkbox (як AinurPOS при відкритті POS-зміни). */
    public function openShift(float $openingCashUah = 0): array
    {
        if (!$this->isEnabled()) {
            throw new \RuntimeException('PRRO вимкнено');
        }
        $this->signIn();
        $current = $this->getCashierShift();
        if ($this->isShiftOpen($current)) {
            return [
                'already_open' => true,
                'shift' => $this->shiftSummary($current),
            ];
        }

        $created = $this->request('POST', '/shifts', []);
        $shiftId = $created['id'] ?? null;
        if (!$shiftId) {
            throw new \RuntimeException('Checkbox не повернув ID зміни');
        }

        $opened = $this->waitShiftOpened($shiftId);
        if ($openingCashUah > 0) {
            $this->serviceCashIn($openingCashUah);
            $opened = $this->getCashierShift();
        }

        return [
            'already_open' => false,
            'shift' => $this->shiftSummary($opened),
        ];
    }

    public function ensureShift(): void
    {
        if (!$this->isEnabled()) {
            return;
        }
        $this->openShift(0);
    }

    public function closeShift(): array
    {
        if (!$this->isEnabled()) {
            return ['closed' => false, 'reason' => 'disabled'];
        }
        $this->signIn();
        $shift = $this->getCashierShift();
        if (!$this->isShiftOpen($shift)) {
            return ['closed' => false, 'reason' => 'not_open'];
        }
        $shiftId = $shift['id'];
        $this->request('POST', '/shifts/close', []);
        $closed = $this->waitShiftClosed($shiftId);
        return [
            'closed' => true,
            'shift' => $this->shiftSummary($closed),
        ];
    }

    public function serviceCashIn(float $amountUah): array
    {
        $kop = (int) round($amountUah * 100);
        if ($kop <= 0) {
            return [];
        }
        return $this->request('POST', '/receipts/service', [
            'id' => $this->uuid(),
            'payment' => ['type' => 'CASH', 'value' => $kop],
        ]);
    }

    protected function waitShiftOpened(string $shiftId, int $timeoutSec = 45): array
    {
        $deadline = time() + $timeoutSec;
        do {
            $shift = $this->request('GET', "/shifts/{$shiftId}");
            $status = strtoupper($shift['status'] ?? '');
            if ($status === 'OPENED') {
                return $shift;
            }
            if ($status === 'CLOSED') {
                $err = $shift['initial_transaction']['response_error_message'] ?? 'Зміна Checkbox закрита';
                throw new \RuntimeException('Checkbox: ' . $err);
            }
            usleep(800000);
        } while (time() < $deadline);

        throw new \RuntimeException('Checkbox: час очікування відкриття зміни вичерпано');
    }

    protected function waitShiftClosed(string $shiftId, int $timeoutSec = 45): array
    {
        $deadline = time() + $timeoutSec;
        do {
            $shift = $this->request('GET', "/shifts/{$shiftId}");
            $status = strtoupper($shift['status'] ?? '');
            if ($status === 'CLOSED') {
                return $shift;
            }
            usleep(800000);
        } while (time() < $deadline);

        throw new \RuntimeException('Checkbox: час очікування закриття зміни вичерпано');
    }

    protected function isShiftOpen(array $shift): bool
    {
        return !empty($shift['id']) && strtoupper($shift['status'] ?? '') === 'OPENED';
    }

    protected function shiftSummary(array $shift): ?array
    {
        if (empty($shift['id'])) {
            return null;
        }
        $balance = $shift['balance'] ?? [];
        return [
            'id' => $shift['id'],
            'serial' => $shift['serial'] ?? null,
            'status' => $shift['status'] ?? null,
            'opened_at' => $shift['opened_at'] ?? null,
            'balance' => isset($balance['balance']) ? round((float) $balance['balance'] / 100, 2) : null,
            'initial' => isset($balance['initial']) ? round((float) $balance['initial'] / 100, 2) : null,
        ];
    }

    protected function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff)
        );
    }

    public function fiscalizeSale(array $sale, array $items, array $payments): array
    {
        if (!$this->isEnabled()) {
            throw new \RuntimeException('PRRO вимкнено');
        }
        $this->signIn();
        $this->ensureShift();

        $goods = [];
        foreach ($items as $it) {
            $priceKop = (int) round((float) $it['price'] * 100);
            $qty = (float) $it['quantity'];
            $goods[] = [
                'good' => [
                    'code' => (string) ($it['product_id'] ?? $it['id'] ?? ''),
                    'name' => mb_substr($it['name'] ?? 'Товар', 0, 256),
                    'price' => max(10, $priceKop),
                ],
                'quantity' => (int) round($qty * 1000),
                'is_return' => false,
            ];
        }

        $payLines = [];
        if (($payments['cash'] ?? 0) > 0) {
            $payLines[] = ['type' => 'CASH', 'value' => (int) round($payments['cash'] * 100)];
        }
        if (($payments['card'] ?? 0) > 0) {
            $payLines[] = ['type' => 'CASHLESS', 'value' => (int) round($payments['card'] * 100), 'label' => 'Картка'];
        }
        if (!$payLines) {
            $payLines[] = ['type' => 'CASH', 'value' => (int) round((float) $sale['total'] * 100)];
        }

        $body = [
            'goods' => $goods,
            'payments' => $payLines,
            'header' => $this->settings['company_name'] ?? 'StarNet Core',
            'footer' => $this->settings['receipt_footer'] ?? '',
        ];

        $receipt = $this->request('POST', '/receipts/sell', $body);
        return [
            'fiscal_code' => $receipt['fiscal_code'] ?? ($receipt['tax_url'] ?? null),
            'receipt_id' => $receipt['id'] ?? null,
            'receipt' => $receipt,
        ];
    }

    public function fiscalReturn(array $sale, array $items): array
    {
        $this->signIn();
        $this->ensureShift();

        $goods = [];
        foreach ($items as $it) {
            $goods[] = [
                'good' => [
                    'code' => (string) ($it['product_id'] ?? ''),
                    'name' => mb_substr($it['name'] ?? 'Товар', 0, 256),
                    'price' => max(10, (int) round((float) $it['price'] * 100)),
                ],
                'quantity' => (int) round((float) $it['quantity'] * 1000),
                'is_return' => true,
            ];
        }

        $totalKop = (int) round(array_sum(array_map(fn ($i) => (float) $i['total'], $items)) * 100);
        $receipt = $this->request('POST', '/receipts/sell', [
            'goods' => $goods,
            'payments' => [['type' => 'CASH', 'value' => max(10, $totalKop)]],
            'related_receipt_id' => $sale['fiscal_receipt_id'] ?? null,
        ]);

        return [
            'fiscal_code' => $receipt['fiscal_code'] ?? null,
            'receipt_id' => $receipt['id'] ?? null,
        ];
    }

    public function receiptPng(string $receiptId): ?string
    {
        if (!$this->token) {
            $this->signIn();
        }
        $client = \Config\Services::curlrequest(['baseURI' => $this->baseUrl . '/', 'timeout' => 30]);
        $res = $client->get("receipts/{$receiptId}/png", [
            'headers' => $this->headers(),
        ]);
        if ($res->getStatusCode() !== 200) {
            return null;
        }
        return $res->getBody();
    }

    protected function request(string $method, string $path, array $body = [], bool $auth = true): array
    {
        $client = \Config\Services::curlrequest(['baseURI' => $this->baseUrl . '/', 'timeout' => 30]);
        $opts = ['headers' => $this->headers($auth)];
        if ($body) {
            $opts['json'] = $body;
        }
        $res = $client->request($method, ltrim($path, '/'), $opts);
        $data = json_decode($res->getBody(), true) ?? [];
        if ($res->getStatusCode() >= 400) {
            $msg = $data['message'] ?? ($data['detail'][0]['msg'] ?? null) ?? "Checkbox HTTP {$res->getStatusCode()}";
            throw new \RuntimeException(is_string($msg) ? $msg : json_encode($msg));
        }
        return $data;
    }

    protected function headers(bool $withAuth = true): array
    {
        $h = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'X-Client-Name' => 'StarNet-Core',
            'X-Client-Version' => '1.0',
        ];
        if (!empty($this->settings['checkbox_license_key'])) {
            $h['X-License-Key'] = $this->settings['checkbox_license_key'];
        }
        if ($withAuth && $this->token) {
            $h['Authorization'] = 'Bearer ' . $this->token;
        }
        return $h;
    }
}
