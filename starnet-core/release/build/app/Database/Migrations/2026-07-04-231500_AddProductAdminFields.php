<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddProductAdminFields extends Migration
{
    public function up()
    {
        $cols = [
            'product_code' => "VARCHAR(32) NULL",
            'country' => "VARCHAR(64) NULL",
            'supplier_id' => "INT UNSIGNED NULL",
            'group_id' => "INT UNSIGNED NULL",
            'tax_percent' => "DECIMAL(5,2) DEFAULT 0",
            'markup_percent' => "DECIMAL(8,2) DEFAULT 0",
            'min_stock' => "DECIMAL(12,3) DEFAULT 0",
            'expiry_date' => "DATE NULL",
            'free_price' => "TINYINT DEFAULT 0",
            'discount_percent' => "DECIMAL(5,2) DEFAULT 0",
            'packaging_qty' => "DECIMAL(12,3) DEFAULT 1",
            'image_urls' => "TEXT NULL",
        ];
        foreach ($cols as $name => $def) {
            if (!$this->db->fieldExists($name, 'products')) {
                $this->db->query("ALTER TABLE products ADD COLUMN {$name} {$def}");
            }
        }

        if (!$this->db->fieldExists('is_group', 'categories')) {
            $this->db->query('ALTER TABLE categories ADD COLUMN is_group TINYINT DEFAULT 0');
        }

        if (!$this->db->tableExists('product_categories')) {
            $this->forge->addField([
                'product_id' => ['type' => 'INT', 'unsigned' => true],
                'category_id' => ['type' => 'INT', 'unsigned' => true],
            ]);
            $this->forge->addKey(['product_id', 'category_id'], true);
            $this->forge->createTable('product_categories', true);
        }
    }

    public function down()
    {
        $this->forge->dropTable('product_categories', true);
    }
}
