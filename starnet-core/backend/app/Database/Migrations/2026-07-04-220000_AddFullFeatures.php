<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFullFeatures extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'type' => ['type' => 'VARCHAR', 'constraint' => 32],
            'warehouse_id' => ['type' => 'INT', 'unsigned' => true],
            'target_warehouse_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'supplier_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'product_id' => ['type' => 'INT', 'unsigned' => true],
            'quantity' => ['type' => 'DECIMAL', 'constraint' => '12,3'],
            'cost' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'user_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('warehouse_operations', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'supplier_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
            'warehouse_id' => ['type' => 'INT', 'unsigned' => true],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'draft'],
            'total' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'received_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('purchase_orders', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'purchase_order_id' => ['type' => 'INT', 'unsigned' => true],
            'product_id' => ['type' => 'INT', 'unsigned' => true],
            'quantity' => ['type' => 'DECIMAL', 'constraint' => '12,3'],
            'cost' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
            'total' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('purchase_order_items', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'warehouse_id' => ['type' => 'INT', 'unsigned' => true],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'open'],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'completed_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('inventory_counts', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'inventory_count_id' => ['type' => 'INT', 'unsigned' => true],
            'product_id' => ['type' => 'INT', 'unsigned' => true],
            'expected_qty' => ['type' => 'DECIMAL', 'constraint' => '12,3', 'default' => 0],
            'actual_qty' => ['type' => 'DECIMAL', 'constraint' => '12,3', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('inventory_count_items', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'customer_name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'phone' => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true],
            'email' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'new'],
            'delivery_type' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'pickup'],
            'address' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'total' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('estore_orders', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'estore_order_id' => ['type' => 'INT', 'unsigned' => true],
            'product_id' => ['type' => 'INT', 'unsigned' => true],
            'quantity' => ['type' => 'DECIMAL', 'constraint' => '12,3'],
            'price' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
            'total' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('estore_order_items', true);

        $this->db->query('ALTER TABLE products ADD COLUMN estore_visible TINYINT DEFAULT 1');
        $this->db->query('ALTER TABLE customers ADD COLUMN card_number VARCHAR(32)');
    }

    public function down()
    {
        foreach ([
            'estore_order_items', 'estore_orders', 'inventory_count_items', 'inventory_counts',
            'purchase_order_items', 'purchase_orders', 'warehouse_operations',
        ] as $t) {
            $this->forge->dropTable($t, true);
        }
    }
}
