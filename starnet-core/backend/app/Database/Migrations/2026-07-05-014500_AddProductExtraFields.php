<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddProductExtraFields extends Migration
{
    public function up()
    {
        $cols = [
            'store_prices' => 'TEXT NULL',
            'modifications' => 'TEXT NULL',
            'has_modifications' => 'TINYINT DEFAULT 0',
        ];
        foreach ($cols as $name => $def) {
            if (!$this->db->fieldExists($name, 'products')) {
                $this->db->query("ALTER TABLE products ADD COLUMN {$name} {$def}");
            }
        }
    }

    public function down() {}
}
