<?php

namespace App\Controllers\Api;

class ExportController extends BaseApiController
{
    public function products()
    {
        $rows = db_connect()->table('products')->where('active', 1)->get()->getResultArray();
        $csv = "id,name,sku,barcode,retail_price,cost_price,unit\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [
                $r['id'],
                '"' . str_replace('"', '""', $r['name']) . '"',
                $r['sku'] ?? '',
                $r['barcode'] ?? '',
                $r['retail_price'],
                $r['cost_price'],
                $r['unit'] ?? 'шт',
            ]) . "\n";
        }
        return $this->response
            ->setHeader('Content-Type', 'text/csv; charset=utf-8')
            ->setHeader('Content-Disposition', 'attachment; filename="products.csv"')
            ->setBody("\xEF\xBB\xBF" . $csv);
    }

    public function customers()
    {
        $rows = db_connect()->table('customers')->get()->getResultArray();
        $csv = "id,name,phone,email,loyalty_points,debt,discount_percent\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [
                $r['id'],
                '"' . str_replace('"', '""', $r['name']) . '"',
                $r['phone'] ?? '',
                $r['email'] ?? '',
                $r['loyalty_points'],
                $r['debt'],
                $r['discount_percent'],
            ]) . "\n";
        }
        return $this->response
            ->setHeader('Content-Type', 'text/csv; charset=utf-8')
            ->setHeader('Content-Disposition', 'attachment; filename="customers.csv"')
            ->setBody("\xEF\xBB\xBF" . $csv);
    }

    public function importProducts()
    {
        $body = $this->request->getJSON(true) ?? [];
        $rows = $body['rows'] ?? [];
        $db = db_connect();
        $imported = 0;

        foreach ($rows as $row) {
            if (empty($row['name'])) {
                continue;
            }
            $existing = null;
            if (!empty($row['barcode'])) {
                $existing = $db->table('products')->where('barcode', $row['barcode'])->get()->getRowArray();
            }
            $data = [
                'name' => $row['name'],
                'sku' => $row['sku'] ?? null,
                'barcode' => $row['barcode'] ?? null,
                'retail_price' => (float) ($row['retail_price'] ?? 0),
                'cost_price' => (float) ($row['cost_price'] ?? 0),
                'unit' => $row['unit'] ?? 'шт',
                'active' => 1,
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            if ($existing) {
                $db->table('products')->where('id', $existing['id'])->update($data);
            } else {
                $data['created_at'] = date('Y-m-d H:i:s');
                $db->table('products')->insert($data);
                $imported++;
            }
        }

        return $this->ok(['imported' => $imported, 'total' => count($rows)]);
    }
}
