import { useEffect, useState } from 'react';
import { Search, Plus, ScanBarcode, Loader2 } from 'lucide-react';
import { api, fmtUah } from '../api';

export default function Products() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');
  const [form, setForm] = useState({
    name: '', barcode: '', sku: '', retail_price: '', cost_price: '', unit: 'шт', image_url: '', initial_stock: 0,
  });

  const load = () => api.products(1, search).then(setData);
  useEffect(() => { load(); }, [search]);

  async function onBarcodeChange(code) {
    setForm((f) => ({ ...f, barcode: code }));
    if (code.length < 4) { setLookupMsg(''); return; }
    setLookupLoading(true);
    setLookupMsg('');
    try {
      const r = await api.lookupBarcode(code);
      setForm((f) => ({
        ...f,
        name: r.name || f.name,
        image_url: r.image_url || f.image_url,
        retail_price: r.retail_price || f.retail_price,
      }));
      setLookupMsg(r.source === 'openfoodfacts' ? '✓ Знайдено в Open Food Facts' : r.source === 'local' ? '✓ Товар вже є в базі' : '');
    } catch {
      setLookupMsg('Не знайдено — введіть назву вручну');
    } finally {
      setLookupLoading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    await api.createProduct({ ...form, retail_price: +form.retail_price, cost_price: +form.cost_price, initial_stock: +form.initial_stock });
    setShowForm(false);
    setForm({ name: '', barcode: '', sku: '', retail_price: '', cost_price: '', unit: 'шт', image_url: '', initial_stock: 0 });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Товари</h1>
          <p className="text-sm text-muted">Штрихкод → автопошук назви та фото</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input placeholder="Пошук..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-surface-border bg-surface-elevated py-2 pl-10 pr-4 text-sm" />
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium">
            <Plus className="h-4 w-4" /> Додати
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-elevated/60 text-muted">
            <tr>
              <th className="px-4 py-3">Товар</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Штрихкод</th>
              <th className="px-4 py-3">Ціна</th>
            </tr>
          </thead>
          <tbody>
            {data?.products?.map((p) => (
              <tr key={p.id} className="border-t border-surface-border/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.sku}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.barcode}</td>
                <td className="px-4 py-3 text-accent-soft">{fmtUah(p.retail_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h3 className="mb-4 text-lg font-bold">Новий товар</h3>

            <label className="mb-1 flex items-center gap-2 text-xs text-muted"><ScanBarcode className="h-3 w-3" /> Штрихкод</label>
            <div className="relative mb-1">
              <input autoFocus value={form.barcode} onChange={(e) => onBarcodeChange(e.target.value)}
                className="mb-1 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-3 font-mono text-sm focus:border-accent" placeholder="Скануйте або введіть..." />
              {lookupLoading && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-accent" />}
            </div>
            {lookupMsg && <p className="mb-3 text-xs text-success">{lookupMsg}</p>}

            {form.image_url && (
              <img src={form.image_url} alt="" className="mb-4 h-32 w-32 rounded-xl border border-surface-border object-cover" />
            )}

            <label className="mb-1 block text-xs text-muted">Назва *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Роздрібна ціна</label>
                <input type="number" step="0.01" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Собівартість</label>
                <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-surface-border py-2 text-sm text-muted">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm font-medium">Зберегти</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
