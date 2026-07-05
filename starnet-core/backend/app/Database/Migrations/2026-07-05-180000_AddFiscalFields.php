<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFiscalFields extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('sales')) {
            foreach ([
                'fiscal_code' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
                'fiscal_receipt_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
                'is_fiscal' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            ] as $col => $def) {
                if (!$this->db->fieldExists($col, 'sales')) {
                    $this->forge->addColumn('sales', [$col => $def]);
                }
            }
        }
    }

    public function down()
    {
        foreach (['fiscal_code', 'fiscal_receipt_id', 'is_fiscal'] as $col) {
            if ($this->db->fieldExists($col, 'sales')) {
                $this->forge->dropColumn('sales', $col);
            }
        }
    }
}
