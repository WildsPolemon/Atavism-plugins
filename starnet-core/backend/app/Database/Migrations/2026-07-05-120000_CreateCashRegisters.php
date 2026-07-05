<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCashRegisters extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 120],
            'store_name' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'active' => ['type' => 'TINYINT', 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('cash_registers', true);

        $db = db_connect();
        if ($db->table('cash_registers')->countAllResults() === 0) {
            $db->table('cash_registers')->insert([
                'name' => 'Каса №1',
                'store_name' => 'Основний магазин',
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    public function down()
    {
        $this->forge->dropTable('cash_registers', true);
    }
}
