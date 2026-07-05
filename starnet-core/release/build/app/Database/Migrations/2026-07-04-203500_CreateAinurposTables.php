<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAinurposTables extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'email' => ['type' => 'VARCHAR', 'constraint' => 120, 'unique' => true],
            'password_hash' => ['type' => 'VARCHAR', 'constraint' => 255],
            'role' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'cashier'],
            'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('users', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 100],
            'parent_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'sort_order' => ['type' => 'INT', 'default' => 0],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('categories', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 255],
            'sku' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'barcode' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'description' => ['type' => 'TEXT', 'null' => true],
            'category_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'type' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'product'],
            'unit' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'шт'],
            'is_weighted' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'plu' => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true],
            'purchase_price' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'retail_price' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'sale_price' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'null' => true],
            'cost_price' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'image_url' => ['type' => 'VARCHAR', 'constraint' => 500, 'null' => true],
            'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('barcode');
        $this->forge->createTable('products', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'address' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('warehouses', true);

        $this->forge->addField([
            'warehouse_id' => ['type' => 'INT', 'unsigned' => true],
            'product_id' => ['type' => 'INT', 'unsigned' => true],
            'quantity' => ['type' => 'DECIMAL', 'constraint' => '12,3', 'default' => 0],
        ]);
        $this->forge->addKey(['warehouse_id', 'product_id'], true);
        $this->forge->createTable('stock', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'phone' => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true],
            'email' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true],
            'loyalty_points' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'debt' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'discount_percent' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'default' => 0],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('customers', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'user_id' => ['type' => 'INT', 'unsigned' => true],
            'opened_at' => ['type' => 'DATETIME', 'null' => true],
            'closed_at' => ['type' => 'DATETIME', 'null' => true],
            'opening_cash' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'closing_cash' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'null' => true],
            'cash_sales' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'card_sales' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'status' => ['type' => 'VARCHAR', 'constraint' => 10, 'default' => 'open'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('shifts', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'shift_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'customer_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'user_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'completed'],
            'subtotal' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'discount' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'total' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'payment_cash' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'payment_card' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('sales', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'sale_id' => ['type' => 'INT', 'unsigned' => true],
            'product_id' => ['type' => 'INT', 'unsigned' => true],
            'quantity' => ['type' => 'DECIMAL', 'constraint' => '12,3', 'default' => 1],
            'price' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
            'discount' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'total' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('sale_items', true);
    }

    public function down()
    {
        foreach (['sale_items', 'sales', 'shifts', 'customers', 'stock', 'warehouses', 'products', 'categories', 'users'] as $t) {
            $this->forge->dropTable($t, true);
        }
    }
}
