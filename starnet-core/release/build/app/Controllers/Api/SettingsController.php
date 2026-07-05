<?php

namespace App\Controllers\Api;

class SettingsController extends BaseApiController
{
    public function index()
    {
        $rows = db_connect()->table('settings')->get()->getResultArray();
        $out = [];
        foreach ($rows as $r) {
            $out[$r['key']] = $r['value'];
        }
        return $this->ok(['settings' => $out]);
    }

    public function update()
    {
        $body = $this->request->getJSON(true) ?? [];
        $db = db_connect();
        foreach ($body as $key => $value) {
            if (!is_string($key)) {
                continue;
            }
            $exists = $db->table('settings')->where('key', $key)->countAllResults();
            if ($exists) {
                $db->table('settings')->where('key', $key)->update(['value' => (string) $value]);
            } else {
                $db->table('settings')->insert(['key' => $key, 'value' => (string) $value]);
            }
        }
        return $this->index();
    }
}
