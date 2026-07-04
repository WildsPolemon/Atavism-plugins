<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSuppliersAndStores extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'phone' => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true],
            'email' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true],
            'debt' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('suppliers', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'address' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'phone' => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => true],
            'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('stores', true);

        $this->forge->addField([
            'key' => ['type' => 'VARCHAR', 'constraint' => 64],
            'value' => ['type' => 'TEXT', 'null' => true],
        ]);
        $this->forge->addKey('key', true);
        $this->forge->createTable('settings', true);

        $this->db->query('ALTER TABLE sales ADD COLUMN notes TEXT');
        $this->db->query('ALTER TABLE sales ADD COLUMN receipt_email VARCHAR(120)');
    }

    public function down()
    {
        $this->forge->dropTable('suppliers', true);
        $this->forge->dropTable('stores', true);
        $this->forge->dropTable('settings', true);
    }
}
