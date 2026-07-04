<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPaymentDeferred extends Migration
{
    public function up()
    {
        if (!$this->db->fieldExists('payment_deferred', 'sales')) {
            $this->forge->addColumn('sales', [
                'payment_deferred' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0, 'after' => 'payment_card'],
            ]);
        }
    }

    public function down()
    {
        if ($this->db->fieldExists('payment_deferred', 'sales')) {
            $this->forge->dropColumn('sales', 'payment_deferred');
        }
    }
}
