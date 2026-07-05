<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCheckboxShiftId extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('shifts') && !$this->db->fieldExists('checkbox_shift_id', 'shifts')) {
            $this->forge->addColumn('shifts', [
                'checkbox_shift_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            ]);
        }
    }

    public function down()
    {
        if ($this->db->fieldExists('checkbox_shift_id', 'shifts')) {
            $this->forge->dropColumn('shifts', 'checkbox_shift_id');
        }
    }
}
