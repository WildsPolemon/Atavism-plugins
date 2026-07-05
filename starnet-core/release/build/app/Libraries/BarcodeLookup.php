<?php

namespace App\Libraries;

use App\Models\ProductModel;
use CodeIgniter\HTTP\CURLRequest;

class BarcodeLookup
{
    protected ProductModel $products;

    public function __construct()
    {
        $this->products = model(ProductModel::class);
    }

    public function lookup(string $barcode): array
    {
        $barcode = preg_replace('/\D/', '', $barcode);
        if (strlen($barcode) < 4) {
            return ['found' => false, 'error' => 'Невірний штрихкод'];
        }

        $local = $this->products->where('barcode', $barcode)->where('active', 1)->first();
        if ($local) {
            return [
                'found' => true,
                'source' => 'local',
                'name' => $local['name'],
                'image_url' => $local['image_url'],
                'barcode' => $barcode,
                'retail_price' => (float) $local['retail_price'],
                'product_id' => (int) $local['id'],
            ];
        }

        $external = $this->fetchOpenFoodFacts($barcode);
        if ($external['found']) {
            return $external;
        }

        return ['found' => false, 'barcode' => $barcode, 'error' => 'Товар не знайдено в базі'];
    }

    protected function fetchOpenFoodFacts(string $barcode): array
    {
        try {
            /** @var CURLRequest $client */
            $client = service('curlrequest', ['timeout' => 8]);
            $res = $client->get("https://world.openfoodfacts.org/api/v2/product/{$barcode}.json?fields=product_name,image_front_url,brands,quantity");
            $data = json_decode($res->getBody(), true);

            if (($data['status'] ?? 0) !== 1 || empty($data['product'])) {
                return ['found' => false];
            }

            $p = $data['product'];
            $name = trim($p['product_name'] ?? '');
            if ($name === '') {
                return ['found' => false];
            }

            $brand = trim($p['brands'] ?? '');
            if ($brand && stripos($name, $brand) === false) {
                $name = $brand . ' — ' . $name;
            }

            return [
                'found' => true,
                'source' => 'openfoodfacts',
                'name' => $name,
                'image_url' => $p['image_front_url'] ?? null,
                'barcode' => $barcode,
                'quantity' => $p['quantity'] ?? null,
            ];
        } catch (\Throwable) {
            return ['found' => false];
        }
    }
}
