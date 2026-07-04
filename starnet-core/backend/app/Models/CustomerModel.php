<?php

namespace App\Models;

use CodeIgniter\Model;

class CustomerModel extends Model
{
    protected $table = 'customers';
    protected $primaryKey = 'id';
    protected $allowedFields = ['name', 'phone', 'email', 'loyalty_points', 'debt', 'discount_percent', 'notes', 'created_at'];
}
