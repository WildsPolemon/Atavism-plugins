<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCashRegistersAndMoneyMovements extends Migration
{
    public function up()
    {
        if (!$this->db->tableExists('cash_registers')) {
            $this->forge->addField([
                'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
                'name' => ['type' => 'VARCHAR', 'constraint' => 120],
                'store_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'balance' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
                'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id', true);
            $this->forge->createTable('cash_registers');
        }

        if (!$this->db->fieldExists('register_id', 'shifts')) {
            $this->forge->addColumn('shifts', [
                'register_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true, 'after' => 'user_id'],
            ]);
        }

        if (!$this->db->tableExists('money_movements')) {
            $this->forge->addField([
                'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
                'type' => ['type' => 'VARCHAR', 'constraint' => 20],
                'amount' => ['type' => 'DECIMAL', 'constraint' => '12,2'],
                'register_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'shift_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'customer_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'user_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'category' => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true],
                'notes' => ['type' => 'TEXT', 'null' => true],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id', true);
            $this->forge->createTable('money_movements');
        }
    }

    public function down()
    {
        if ($this->db->fieldExists('register_id', 'shifts')) {
            $this->forge->dropColumn('shifts', 'register_id');
        }
        $this->forge->dropTable('money_movements', true);
        $this->forge->dropTable('cash_registers', true);
    }
}
