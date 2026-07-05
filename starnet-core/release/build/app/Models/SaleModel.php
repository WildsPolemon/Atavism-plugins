<?php

namespace App\Models;

use CodeIgniter\Model;

class SaleModel extends Model
{
    protected $table = 'sales';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'shift_id', 'customer_id', 'user_id', 'status', 'subtotal', 'discount',
        'total', 'payment_cash', 'payment_card', 'created_at',
    ];
}
