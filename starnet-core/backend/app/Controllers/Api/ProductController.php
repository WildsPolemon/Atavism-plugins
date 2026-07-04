<?php

namespace App\Controllers\Api;

use App\Models\CategoryModel;
use App\Models\ProductModel;

class ProductController extends BaseApiController
{
    public function categories()
    {
        $all = model(CategoryModel::class)->orderBy('sort_order')->findAll();
        return $this->ok(['categories' => $all]);
    }

    public function createCategory()
    {
        $body = $this->request->getJSON(true) ?? [];
        $id = model(CategoryModel::class)->insert([
            'name' => $body['name'],
            'parent_id' => $body['parent_id'] ?? null,
            'sort_order' => $body['sort_order'] ?? 0,
        ]);
        return $this->ok(model(CategoryModel::class)->find($id), 201);
    }

    public function index()
    {
        $db = db_connect();
        $page = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = 25;
        $offset = ($page - 1) * $limit;
        $search = trim($this->request->getGet('search') ?? '');

        $builder = $db->table('products p')
            ->select('p.*, c.name as category_name')
            ->join('categories c', 'c.id = p.category_id', 'left')
            ->where('p.active', 1);

        if ($search !== '') {
            $builder->groupStart()
                ->like('p.name', $search)
                ->orLike('p.sku', $search)
                ->orLike('p.barcode', $search)
                ->groupEnd();
        }

        $total = (clone $builder)->countAllResults(false);
        $products = $builder->orderBy('p.updated_at', 'DESC')->limit($limit, $offset)->get()->getResultArray();

        return $this->ok(compact('page', 'limit', 'total', 'products'));
    }

    public function create()
    {
        $body = $this->request->getJSON(true) ?? [];
        if (empty($body['name'])) {
            return $this->err('name required');
        }
        $now = date('Y-m-d H:i:s');
        $id = model(ProductModel::class)->insert([
            'name' => $body['name'],
            'sku' => $body['sku'] ?? null,
            'barcode' => $body['barcode'] ?? null,
            'description' => $body['description'] ?? '',
            'category_id' => $body['category_id'] ?? null,
            'type' => $body['type'] ?? 'product',
            'unit' => $body['unit'] ?? 'шт',
            'is_weighted' => !empty($body['is_weighted']) ? 1 : 0,
            'plu' => $body['plu'] ?? null,
            'purchase_price' => $body['purchase_price'] ?? 0,
            'retail_price' => $body['retail_price'] ?? 0,
            'sale_price' => $body['sale_price'] ?? null,
            'cost_price' => $body['cost_price'] ?? 0,
            'image_url' => $body['image_url'] ?? null,
            'active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $wh = db_connect()->table('warehouses')->limit(1)->get()->getRowArray();
        if ($wh) {
            db_connect()->table('stock')->replace([
                'warehouse_id' => $wh['id'],
                'product_id' => $id,
                'quantity' => $body['initial_stock'] ?? 0,
            ]);
        }

        return $this->ok(model(ProductModel::class)->find($id), 201);
    }

    public function update(int $id)
    {
        $body = $this->request->getJSON(true) ?? [];
        $body['updated_at'] = date('Y-m-d H:i:s');
        if (isset($body['is_weighted'])) {
            $body['is_weighted'] = $body['is_weighted'] ? 1 : 0;
        }
        model(ProductModel::class)->update($id, $body);
        return $this->ok(model(ProductModel::class)->find($id));
    }
}
