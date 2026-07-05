<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFinanceSystem extends Migration
{
    public function up()
    {
        if (!$this->db->tableExists('finance_accounts')) {
            $this->forge->addField([
                'id' => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
                'name' => ['type' => 'VARCHAR', 'constraint' => 120],
                'type' => ['type' => 'VARCHAR', 'constraint' => 20],
                'store_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'register_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'balance' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
                'bank_details' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
                'active' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id', true);
            $this->forge->createTable('finance_accounts');
        }

        if (!$this->db->tableExists('register_users')) {
            $this->forge->addField([
                'register_id' => ['type' => 'INT', 'unsigned' => true],
                'user_id' => ['type' => 'INT', 'unsigned' => true],
            ]);
            $this->forge->addKey(['register_id', 'user_id'], true);
            $this->forge->createTable('register_users');
        }

        if ($this->db->tableExists('cash_registers')) {
            foreach (['code', 'terminal_info', 'account_id'] as $col) {
                if (!$this->db->fieldExists($col, 'cash_registers')) {
                    $type = $col === 'account_id' ? ['type' => 'INT', 'unsigned' => true, 'null' => true] :
                        ($col === 'code' ? ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true] :
                            ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true]);
                    $this->forge->addColumn('cash_registers', [$col => $type]);
                }
            }
        }

        if ($this->db->tableExists('money_movements')) {
            foreach ([
                'from_account_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'to_account_id' => ['type' => 'INT', 'unsigned' => true, 'null' => true],
                'expense_category' => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true],
            ] as $col => $def) {
                if (!$this->db->fieldExists($col, 'money_movements')) {
                    $this->forge->addColumn('money_movements', [$col => $def]);
                }
            }
        }

        if ($this->db->tableExists('shifts') && !$this->db->fieldExists('expected_cash', 'shifts')) {
            $this->forge->addColumn('shifts', [
                'expected_cash' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'null' => true],
                'variance' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'null' => true],
            ]);
        }
    }

    public function down()
    {
        foreach (['expected_cash', 'variance'] as $c) {
            if ($this->db->fieldExists($c, 'shifts')) {
                $this->forge->dropColumn('shifts', $c);
            }
        }
        foreach (['from_account_id', 'to_account_id', 'expense_category'] as $c) {
            if ($this->db->fieldExists($c, 'money_movements')) {
                $this->forge->dropColumn('money_movements', $c);
            }
        }
        foreach (['code', 'terminal_info', 'account_id'] as $c) {
            if ($this->db->fieldExists($c, 'cash_registers')) {
                $this->forge->dropColumn('cash_registers', $c);
            }
        }
        $this->forge->dropTable('register_users', true);
        $this->forge->dropTable('finance_accounts', true);
    }
}
