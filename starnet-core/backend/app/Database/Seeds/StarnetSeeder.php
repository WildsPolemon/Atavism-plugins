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
        ];
        foreach ($defaults as $k => $v) {
            if (!$this->db->table('settings')->where('key', $k)->countAllResults()) {
                $this->db->table('settings')->insert(['key' => $k, 'value' => $v]);
            }
        }
    }
}
