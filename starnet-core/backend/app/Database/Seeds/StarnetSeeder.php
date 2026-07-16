<?php

namespace App\Database\Seeds;

use App\Libraries\FinanceService;
use CodeIgniter\Database\Seeder;

class StarnetSeeder extends Seeder
{
    public function run()
    {
        $email = env('starnetcore.adminEmail', 'admin@starnetcore.local');
        $pass = env('starnetcore.adminPassword', 'admin123');

        if (!$this->db->table('users')->where('email', $email)->countAllResults()) {
            $this->db->table('users')->insert([
                'name' => 'Адміністратор',
                'email' => $email,
                'password_hash' => password_hash($pass, PASSWORD_DEFAULT),
                'role' => 'admin',
                'active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        if (!$this->db->table('users')->where('email', 'cashier@starnetcore.local')->countAllResults()) {
            $this->db->table('users')->insert([
                'name' => 'Касир',
                'email' => 'cashier@starnetcore.local',
                'password_hash' => password_hash('cashier123', PASSWORD_DEFAULT),
                'role' => 'cashier',
                'active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        foreach ([
            ['admin', 'admin123', 'admin'],
            ['wanderer', 'player123', 'player'],
        ] as [$login, $pwd, $role]) {
            $email = $login . '@portal.local';
            if (!$this->db->table('users')->where('email', $email)->countAllResults()) {
                $this->db->table('users')->insert([
                    'name' => $login,
                    'email' => $email,
                    'password_hash' => password_hash($pwd, PASSWORD_DEFAULT),
                    'role' => $role,
                    'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
            }
        }

        if ($this->db->table('stores')->countAllResults() === 0) {
            $this->db->table('stores')->insert(['name' => 'Магазин №1', 'address' => 'Київ', 'phone' => '+380', 'active' => 1]);
        }

        if ($this->db->table('suppliers')->countAllResults() === 0) {
            $this->db->table('suppliers')->insert([
                'name' => 'Постачальник А', 'phone' => '+380501111111', 'email' => 'supplier@example.com',
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        if ($this->db->table('warehouses')->countAllResults() === 0) {
            $whId = $this->db->table('warehouses')->insert(['name' => 'Основний склад', 'address' => 'Магазин №1', 'active' => 1]);
            $this->db->table('categories')->insert(['name' => 'Головна', 'sort_order' => 0, 'is_group' => 1]);
            $groupId = $this->db->insertID();
            $this->db->table('categories')->insert(['name' => 'Випічка', 'sort_order' => 1, 'is_group' => 0]);
            $catBakery = $this->db->insertID();
            $this->db->table('categories')->insert(['name' => 'Молочні', 'sort_order' => 2, 'is_group' => 0]);
            $catDairy = $this->db->insertID();

            foreach ([
                ['Хліб білий', 'BR001', '4820000000001', 25, 15, $catBakery],
                ['Молоко 1л', 'ML001', '4820000000002', 35, 28, $catDairy],
                ['Яблука', 'FR001', '2001', 45, 30, $catDairy],
            ] as [$name, $sku, $barcode, $retail, $cost, $tagCat]) {
                $this->db->table('products')->insert([
                    'name' => $name, 'sku' => $sku, 'barcode' => $barcode,
                    'category_id' => $tagCat, 'group_id' => $groupId,
                    'retail_price' => $retail, 'cost_price' => $cost,
                    'unit' => str_contains($name, 'Ябл') ? 'кг' : 'шт',
                    'is_weighted' => str_contains($name, 'Ябл') ? 1 : 0,
                    'active' => 1, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $pid = $this->db->insertID();
                $this->db->table('products')->where('id', $pid)->update(['product_code' => 'P' . str_pad((string) $pid, 6, '0', STR_PAD_LEFT)]);
                $this->db->table('product_categories')->replace(['product_id' => $pid, 'category_id' => $tagCat]);
                $this->db->table('stock')->replace(['warehouse_id' => $whId, 'product_id' => $pid, 'quantity' => 100]);
            }
        }

        $defaults = [
            'company_name' => 'StarNet Core',
            'site_name' => 'StarNet Core',
            'portal_welcome_message' => 'Ласкаво просимо до {site_name}! Стартовий бонус нараховано.',
            'portal_welcome_bonus' => '100',
            'receipt_logo' => '',
            'receipt_footer' => 'Дякуємо за покупку!',
            'receipt_address' => 'м. Київ, вул. Прикладна 1',
            'site_url' => 'https://starnetcore.local',
            'pos_theme' => 'light',
            'pos_sound' => 'on',
            'pos_language' => 'uk',
            'pos_print_default' => '1',
            'pos_printer_type' => 'receipt',
            'pos_receipt_width' => '80',
            'pos_show_zero_stock' => '1',
            'pos_sort_by' => 'name',
            'pos_sort_dir' => 'asc',
            'pos_printer_enabled' => '1',
            'pos_printer_connection' => 'wifi',
            'pos_printer_wifi_ip' => '',
            'pos_printer_baud' => '9600',
            'pos_printer_model' => 'escpos',
            'pos_receipt_font' => '4',
            'pos_receipt_margin' => '4',
            'pos_scale_enabled' => '0',
            'pos_scale_port' => 'COM3',
            'pos_scale_baud' => '9600',
            'pos_scale_data_bits' => '8',
            'pos_scale_stop_bits' => '1',
            'pos_scale_parity' => 'none',
            'pos_scale_protocol' => 'auto',
            'pos_terminal_enabled' => '0',
            'pos_terminal_ip' => '',
            'country' => 'UA',
            'prro_enabled' => '0',
            'checkbox_license_key' => '',
            'checkbox_login' => '',
            'checkbox_password' => '',
            'checkbox_api_url' => 'https://api.checkbox.ua/api/v1',
            'pos_fiscal_default' => '0',
        ];
        foreach ($defaults as $k => $v) {
            if (!$this->db->table('settings')->where('key', $k)->countAllResults()) {
                $this->db->table('settings')->insert(['key' => $k, 'value' => $v]);
            }
        }

        $this->db->table('settings')->where('key', 'company_name')->update(['value' => 'StarNet Core']);
        if (!$this->db->table('settings')->where('key', 'site_name')->countAllResults()) {
            $this->db->table('settings')->insert(['key' => 'site_name', 'value' => 'StarNet Core']);
        }

        $storeId = (int) ($this->db->table('stores')->limit(1)->get()->getRow('id') ?? 0);
        $cashierId = (int) ($this->db->table('users')->where('email', 'cashier@starnetcore.local')->get()->getRow('id') ?? 0);

        if ($this->db->tableExists('finance_accounts') && $this->db->table('finance_accounts')->countAllResults() === 0 && $storeId) {
            $this->db->table('finance_accounts')->insert([
                'name' => 'Рахунок магазину', 'type' => 'store', 'store_id' => $storeId,
                'balance' => 0, 'active' => 1, 'created_at' => date('Y-m-d H:i:s'),
            ]);
            $this->db->table('finance_accounts')->insert([
                'name' => 'Банківський рахунок', 'type' => 'bank', 'store_id' => $storeId,
                'balance' => 0, 'bank_details' => 'UA00...', 'active' => 1, 'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        if ($this->db->tableExists('cash_registers')) {
            if ($this->db->table('cash_registers')->countAllResults() === 0 && $storeId) {
                $this->db->table('cash_registers')->insert([
                    'name' => 'Каса №1', 'code' => 'N1', 'store_id' => $storeId,
                    'terminal_info' => 'Каса', 'balance' => 0, 'active' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
            }
            $regs = $this->db->table('cash_registers')->get()->getResultArray();
            $finance = class_exists(FinanceService::class) ? new FinanceService() : null;
            foreach ($regs as $reg) {
                if (empty($reg['account_id']) && $finance && $this->db->tableExists('finance_accounts')) {
                    $aid = $finance->createCashAccount((int) $reg['id'], $reg['name'], (int) ($reg['store_id'] ?: $storeId), (float) $reg['balance']);
                    if (empty($reg['code'])) {
                        $this->db->table('cash_registers')->where('id', $reg['id'])->update(['code' => 'N' . $reg['id']]);
                    }
                }
                if ($cashierId && $this->db->tableExists('register_users')) {
                    $exists = $this->db->table('register_users')->where('register_id', $reg['id'])->where('user_id', $cashierId)->countAllResults();
                    if (!$exists) {
                        $this->db->table('register_users')->insert(['register_id' => $reg['id'], 'user_id' => $cashierId]);
                    }
                }
            }
        }
    }
}
