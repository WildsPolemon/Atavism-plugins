<?php

namespace App\Controllers\Api;

use App\Models\CategoryModel;
use App\Models\ProductModel;

class ProductController extends BaseApiController
{
    public function categories()
    {
        $all = model(CategoryModel::class)->orderBy('sort_order')->findAll();
        return $this->ok(['categories' => $all, 'groups' => array_values(array_filter($all, fn ($c) => !empty($c['is_group'])))]);
    }

    public function createCategory()
    {
        $body = $this->request->getJSON(true) ?? [];
        $id = model(CategoryModel::class)->insert([
            'name' => $body['name'],
            'parent_id' => $body['parent_id'] ?? null,
            'sort_order' => $body['sort_order'] ?? 0,
            'is_group' => !empty($body['is_group']) ? 1 : 0,
        ]);
        return $this->ok(model(CategoryModel::class)->find($id), 201);
    }

    public function updateCategory(int $id)
    {
        $body = $this->request->getJSON(true) ?? [];
        if (isset($body['is_group'])) {
            $body['is_group'] = $body['is_group'] ? 1 : 0;
        }
        model(CategoryModel::class)->update($id, $body);
        return $this->ok(model(CategoryModel::class)->find($id));
    }

    public function deleteCategory(int $id)
    {
        $db = db_connect();
        $db->table('product_categories')->where('category_id', $id)->delete();
        $db->table('products')->where('category_id', $id)->update(['category_id' => null]);
        $db->table('products')->where('group_id', $id)->update(['group_id' => null]);
        model(CategoryModel::class)->delete($id);
        return $this->ok(['deleted' => true]);
    }

    public function index()
    {
        $db = db_connect();
        $page = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = 25;
        $offset = ($page - 1) * $limit;
        $search = trim($this->request->getGet('search') ?? '');
        $type = trim($this->request->getGet('type') ?? '');
        $categoryId = (int) ($this->request->getGet('category_id') ?? 0);
        $groupId = (int) ($this->request->getGet('group_id') ?? 0);

        $builder = $db->table('products p')
            ->select('p.*, c.name as category_name, g.name as group_name, s.name as supplier_name, st.quantity as stock_qty')
            ->join('categories c', 'c.id = p.category_id', 'left')
            ->join('categories g', 'g.id = p.group_id', 'left')
            ->join('suppliers s', 's.id = p.supplier_id', 'left')
            ->join('stock st', 'st.product_id = p.id', 'left')
            ->where('p.active', 1);

        if ($search !== '') {
            $builder->groupStart()
                ->like('p.name', $search)
                ->orLike('p.sku', $search)
                ->orLike('p.barcode', $search)
                ->orLike('p.product_code', $search)
                ->orLike('p.description', $search)
                ->groupEnd();
        }
        if ($type !== '') {
            $builder->where('p.type', $type);
        }
        if ($categoryId > 0) {
            $builder->join('product_categories pc', 'pc.product_id = p.id', 'inner')
                ->where('pc.category_id', $categoryId);
        }
        if ($groupId > 0) {
            $builder->where('p.group_id', $groupId);
        }

        $total = (clone $builder)->countAllResults(false);
        $products = $builder->orderBy('p.updated_at', 'DESC')->limit($limit, $offset)->get()->getResultArray();

        foreach ($products as &$p) {
            $p['category_tags'] = $db->table('product_categories pc')
                ->select('c.id, c.name')
                ->join('categories c', 'c.id = pc.category_id')
                ->where('pc.product_id', $p['id'])
                ->get()->getResultArray();
        }

        return $this->ok(compact('page', 'limit', 'total', 'products'));
    }

    public function create()
    {
        $body = $this->request->getJSON(true) ?? [];
        if (empty($body['name'])) {
            return $this->err('name required');
        }
        $now = date('Y-m-d H:i:s');
        $purchase = (float) ($body['purchase_price'] ?? 0);
        $markup = (float) ($body['markup_percent'] ?? 0);
        $retail = isset($body['retail_price']) ? (float) $body['retail_price'] : 0;
        if ($purchase > 0 && $markup > 0 && empty($body['retail_price'])) {
            $retail = round($purchase * (1 + $markup / 100), 2);
        }

        $id = model(ProductModel::class)->insert([
            'name' => $body['name'],
            'sku' => $body['sku'] ?? null,
            'barcode' => $body['barcode'] ?? null,
            'product_code' => $body['product_code'] ?? null,
            'description' => $body['description'] ?? '',
            'category_id' => $body['category_id'] ?? null,
            'group_id' => $body['group_id'] ?? null,
            'type' => $body['type'] ?? 'product',
            'unit' => $body['unit'] ?? 'шт',
            'is_weighted' => !empty($body['is_weighted']) ? 1 : 0,
            'plu' => $body['plu'] ?? null,
            'purchase_price' => $purchase,
            'markup_percent' => $markup,
            'retail_price' => $retail,
            'sale_price' => $body['sale_price'] ?? null,
            'cost_price' => $body['cost_price'] ?? $purchase,
            'tax_percent' => $body['tax_percent'] ?? 0,
            'discount_percent' => $body['discount_percent'] ?? 0,
            'min_stock' => $body['min_stock'] ?? 0,
            'expiry_date' => $body['expiry_date'] ?? null,
            'free_price' => !empty($body['free_price']) ? 1 : 0,
            'packaging_qty' => $body['packaging_qty'] ?? 1,
            'country' => $body['country'] ?? null,
            'supplier_id' => $body['supplier_id'] ?? null,
            'image_url' => $body['image_url'] ?? null,
            'image_urls' => isset($body['image_urls']) ? json_encode($body['image_urls']) : null,
            'estore_visible' => isset($body['estore_visible']) ? (int) $body['estore_visible'] : 1,
            'store_prices' => isset($body['store_prices']) ? json_encode($body['store_prices']) : null,
            'has_modifications' => !empty($body['has_modifications']) ? 1 : 0,
            'modifications' => isset($body['modifications']) ? json_encode($body['modifications']) : null,
            'active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if (empty($body['product_code'])) {
            model(ProductModel::class)->update($id, ['product_code' => 'P' . str_pad((string) $id, 6, '0', STR_PAD_LEFT)]);
        }

        $this->syncCategoryTags($id, $body['category_ids'] ?? []);
        $this->setInitialStock($id, $body);

        return $this->ok($this->findProduct($id), 201);
    }

    public function update(int $id)
    {
        $body = $this->request->getJSON(true) ?? [];
        $body['updated_at'] = date('Y-m-d H:i:s');
        if (isset($body['is_weighted'])) {
            $body['is_weighted'] = $body['is_weighted'] ? 1 : 0;
        }
        if (isset($body['free_price'])) {
            $body['free_price'] = $body['free_price'] ? 1 : 0;
        }
        if (isset($body['image_urls']) && is_array($body['image_urls'])) {
            $body['image_urls'] = json_encode($body['image_urls']);
        }
        if (isset($body['store_prices']) && is_array($body['store_prices'])) {
            $body['store_prices'] = json_encode($body['store_prices']);
        }
        if (isset($body['modifications']) && is_array($body['modifications'])) {
            $body['modifications'] = json_encode($body['modifications']);
        }
        if (isset($body['has_modifications'])) {
            $body['has_modifications'] = $body['has_modifications'] ? 1 : 0;
        }
        if (isset($body['purchase_price'], $body['markup_percent']) && empty($body['retail_price'])) {
            $purchase = (float) $body['purchase_price'];
            $markup = (float) $body['markup_percent'];
            if ($purchase > 0 && $markup > 0) {
                $body['retail_price'] = round($purchase * (1 + $markup / 100), 2);
            }
        }
        if (isset($body['category_ids'])) {
            $this->syncCategoryTags($id, $body['category_ids']);
            unset($body['category_ids']);
        }
        model(ProductModel::class)->update($id, $body);
        return $this->ok($this->findProduct($id));
    }

    public function generateBarcode(int $id)
    {
        $p = model(ProductModel::class)->find($id);
        if (!$p) {
            return $this->err('not found', 404);
        }
        $code = $p['product_code'] ?: ('P' . str_pad((string) $id, 6, '0', STR_PAD_LEFT));
        $barcode = '200' . str_pad((string) $id, 10, '0', STR_PAD_LEFT);
        model(ProductModel::class)->update($id, ['barcode' => $barcode, 'product_code' => $code, 'updated_at' => date('Y-m-d H:i:s')]);
        return $this->ok(['barcode' => $barcode, 'product_code' => $code]);
    }

    private function syncCategoryTags(int $productId, array $categoryIds): void
    {
        $db = db_connect();
        $db->table('product_categories')->where('product_id', $productId)->delete();
        foreach (array_unique(array_filter(array_map('intval', $categoryIds))) as $cid) {
            $db->table('product_categories')->insert(['product_id' => $productId, 'category_id' => $cid]);
        }
    }

    private function setInitialStock(int $id, array $body): void
    {
        $db = db_connect();
        $stocks = $body['warehouse_stocks'] ?? null;
        if (is_array($stocks) && $stocks) {
            foreach ($stocks as $whId => $qty) {
                if ((float) $qty > 0) {
                    $db->table('stock')->replace([
                        'warehouse_id' => (int) $whId,
                        'product_id' => $id,
                        'quantity' => (float) $qty,
                    ]);
                }
            }
            return;
        }
        $wh = $db->table('warehouses')->limit(1)->get()->getRowArray();
        if ($wh && isset($body['initial_stock'])) {
            $db->table('stock')->replace([
                'warehouse_id' => $wh['id'],
                'product_id' => $id,
                'quantity' => (float) ($body['initial_stock'] ?? 0),
            ]);
        }
    }

    private function findProduct(int $id): array
    {
        $db = db_connect();
        $p = model(ProductModel::class)->find($id);
        $p['category_tags'] = $db->table('product_categories pc')
            ->select('c.id, c.name')
            ->join('categories c', 'c.id = pc.category_id')
            ->where('pc.product_id', $id)
            ->get()->getResultArray();
        foreach (['image_urls', 'store_prices', 'modifications'] as $jsonField) {
            if (!empty($p[$jsonField]) && is_string($p[$jsonField])) {
                $p[$jsonField] = json_decode($p[$jsonField], true);
            }
        }
        return $p;
    }
}
