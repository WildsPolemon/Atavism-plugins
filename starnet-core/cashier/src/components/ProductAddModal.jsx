import { useState } from 'react';
import { ScanBarcode } from 'lucide-react';

export default function ProductAddModal({ barcode: initialBarcode = '', categories = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    barcode: initialBarcode,
    sku: '',
    category_id: categories[0]?.id ? String(categories[0].id) : '',
    unit: 'шт',
    retail_price: '',
    cost_price: '',
    sale_price: '',
    initial_stock: '0',
    description: '',
    is_weighted: false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      category_id: form.category_id ? +form.category_id : null,
      retail_price: +form.retail_price,
      cost_price: +form.cost_price || 0,
      sale_price: form.sale_price ? +form.sale_price : null,
      initial_stock: +form.initial_stock || 0,
      is_weighted: form.is_weighted ? 1 : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4 pt-16">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <ScanBarcode className="h-8 w-8 text-ainur-blue" />
          <div>
            <h3 className="text-lg font-semibold">Новий товар</h3>
            <p className="text-xs text-ainur-muted">Додати товар у каталог і в чек</p>
          </div>
        </div>

        <label className="mb-1 block text-xs text-ainur-muted">Штрихкод</label>
        <input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} className="mb-3 w-full rounded-lg border border-ainur-border px-3 py-2 font-mono text-sm" />

        <label className="mb-1 block text-xs text-ainur-muted">Назва *</label>
        <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="mb-3 w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Артикул (SKU)</label>
            <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Категорія</label>
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm">
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Ціна продажу *</label>
            <input required type="number" step="0.01" value={form.retail_price} onChange={(e) => set('retail_price', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Акційна</label>
            <input type="number" step="0.01" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Собівартість</label>
            <input type="number" step="0.01" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Одиниця</label>
            <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm">
              <option value="шт">шт</option>
              <option value="кг">кг</option>
              <option value="л">л</option>
              <option value="уп">уп</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ainur-muted">Початковий залишок</label>
            <input type="number" step="0.001" value={form.initial_stock} onChange={(e) => set('initial_stock', e.target.value)} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
          </div>
        </div>

        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_weighted} onChange={(e) => set('is_weighted', e.target.checked)} />
          Ваговий товар
        </label>

        <label className="mb-1 block text-xs text-ainur-muted">Опис</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="mb-4 w-full rounded-lg border border-ainur-border px-3 py-2 text-sm resize-none" />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Скасувати</button>
          <button type="submit" className="flex-1 rounded-lg bg-ainur-orange py-2.5 text-sm font-bold text-white">ЗБЕРЕГТИ ТА ДОДАТИ</button>
        </div>
      </form>
    </div>
  );
}
