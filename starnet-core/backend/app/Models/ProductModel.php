<?php

namespace App\Models;

use CodeIgniter\Model;

class ProductModel extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'name', 'sku', 'barcode', 'description', 'category_id', 'type', 'unit',
        'is_weighted', 'plu', 'purchase_price', 'retail_price', 'sale_price',
        'cost_price', 'image_url', 'active', 'created_at', 'updated_at',
    ];
    protected $useTimestamps = false;
}
