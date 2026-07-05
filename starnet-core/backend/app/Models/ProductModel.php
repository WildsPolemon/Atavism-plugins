<?php

namespace App\Models;

use CodeIgniter\Model;

class ProductModel extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'name', 'sku', 'barcode', 'product_code', 'description', 'category_id', 'group_id',
        'type', 'unit', 'is_weighted', 'plu', 'purchase_price', 'retail_price', 'sale_price',
        'cost_price', 'markup_percent', 'tax_percent', 'discount_percent', 'min_stock',
        'expiry_date', 'free_price', 'packaging_qty', 'country', 'supplier_id',
        'image_url', 'image_urls', 'estore_visible', 'store_prices', 'modifications', 'has_modifications',
        'active', 'created_at', 'updated_at',
    ];
    protected $useTimestamps = false;
}
