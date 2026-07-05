<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddShiftCashMovements extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'shift_id' => ['type' => 'INT', 'unsigned' => true],
            'user_id' => ['type' => 'INT', 'unsigned' => true],
            'type' => ['type' => 'VARCHAR', 'constraint' => 8],
            'amount' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'note' => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('shift_id');
        $this->forge->createTable('shift_cash_movements', true);

        $fields = [
            'expected_cash' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'null' => true],
            'variance' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'null' => true],
            'cash_in_total' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'cash_out_total' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
        ];
        $this->forge->addColumn('shifts', $fields);
    }

    public function down()
    {
        $this->forge->dropTable('shift_cash_movements', true);
        $this->forge->dropColumn('shifts', ['expected_cash', 'variance', 'cash_in_total', 'cash_out_total']);
    }
}
