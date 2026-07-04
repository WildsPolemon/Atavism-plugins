<?php

namespace App\Database\Seeds;

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
            $catId = $this->db->table('categories')->insert(['name' => 'Загальне', 'sort_order' => 0]);

            foreach ([
                ['Хліб білий', 'BR001', '4820000000001', 25, 15],
                ['Молоко 1л', 'ML001', '4820000000002', 35, 28],
                ['Яблука', 'FR001', '2001', 45, 30],
            ] as [$name, $sku, $barcode, $retail, $cost]) {
                $pid = $this->db->table('products')->insert([
                    'name' => $name, 'sku' => $sku, 'barcode' => $barcode,
                    'category_id' => $catId, 'retail_price' => $retail, 'cost_price' => $cost,
                    'unit' => str_contains($name, 'Ябл') ? 'кг' : 'шт',
                    'is_weighted' => str_contains($name, 'Ябл') ? 1 : 0,
                    'active' => 1, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $this->db->table('stock')->replace(['warehouse_id' => $whId, 'product_id' => $pid, 'quantity' => 100]);
            }
        }

        $defaults = [
            'company_name' => 'StarNet Core',
            'receipt_logo' => '',
            'receipt_footer' => 'Дякуємо за покупку!',
            'site_url' => 'https://starnetcore.local',
        ];
        foreach ($defaults as $k => $v) {
            if (!$this->db->table('settings')->where('key', $k)->countAllResults()) {
                $this->db->table('settings')->insert(['key' => $k, 'value' => $v]);
            }
        }
    }
}
