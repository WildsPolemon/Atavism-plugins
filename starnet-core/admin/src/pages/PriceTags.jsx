import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

export default function PriceTags({ embedded }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => { api.products(1).then((r) => setProducts(r.products || [])); }, []);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const print = () => {
    const items = products.filter((p) => selected.includes(p.id));
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Цінники</title><style>
      body{font-family:Inter,sans-serif;padding:20px}
      .tag{display:inline-block;width:180px;border:1px dashed #999;padding:12px;margin:8px;text-align:center}
      .name{font-size:14px;font-weight:600;margin-bottom:8px}
      .price{font-size:22px;font-weight:bold;color:#4f46e5}
      .barcode{font-size:11px;color:#666;margin-top:6px}
    </style></head><body>`);
    items.forEach((p) => {
      w.document.write(`<div class="tag"><div class="name">${p.name}</div><div class="price">${fmtUah(p.sale_price || p.retail_price)}</div><div class="barcode">${p.barcode || p.sku || ''}</div></div>`);
    });
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  return (
    <div>
      {!embedded ? (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ainur-text">Цінники та етикетки</h1>
            <p className="text-sm text-ainur-muted">Друк цінників зі штрихкодом</p>
          </div>
          <button onClick={print} disabled={!selected.length} className="rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Друк ({selected.length})</button>
        </div>
      ) : (
        <div className="mb-4 flex justify-end">
          <button onClick={print} disabled={!selected.length} className="rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Друк ({selected.length})</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.map((p) => (
          <button key={p.id} onClick={() => toggle(p.id)} className={`rounded-xl border p-4 text-left transition ${selected.includes(p.id) ? 'border-accent bg-accent/10' : 'border-surface-border bg-surface-elevated'}`}>
            <p className="font-medium text-sm">{p.name}</p>
            <p className="text-accent">{fmtUah(p.sale_price || p.retail_price)}</p>
            <p className="text-xs text-muted">{p.barcode}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
