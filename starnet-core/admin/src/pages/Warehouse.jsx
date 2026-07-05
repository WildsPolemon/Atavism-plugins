import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

const TABS = [
  { id: 'stock', label: 'Залишки' },
  { id: 'ops', label: 'Операції' },
  { id: 'action', label: 'Нова операція' },
];

export default function Warehouse({ embedded }) {
  const [tab, setTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [ops, setOps] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ type: 'receipt', warehouse_id: '', product_id: '', quantity: '', cost: '', target_warehouse_id: '', notes: '' });

  const load = () => {
    api.stock().then((r) => setStock(r.stock || []));
    api.warehouseOps().then((r) => setOps(r.operations || []));
    api.warehouses().then((r) => setWarehouses(r.warehouses || []));
    api.products(1).then((r) => setProducts(r.products || []));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.warehouseOp({ ...form, warehouse_id: +form.warehouse_id, product_id: +form.product_id, quantity: +form.quantity, cost: +form.cost || 0, target_warehouse_id: form.target_warehouse_id ? +form.target_warehouse_id : null });
    setForm({ type: 'receipt', warehouse_id: form.warehouse_id, product_id: '', quantity: '', cost: '', target_warehouse_id: '', notes: '' });
    load();
    setTab('ops');
  };

  return (
    <div>
      {!embedded && (
        <>
          <h1 className="text-2xl font-bold text-ainur-text">Склад</h1>
          <p className="mb-4 text-sm text-ainur-muted">Закупівлі, списання, переміщення, коригування</p>
        </>
      )}
      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm ${tab === t.id ? 'bg-accent text-white' : 'bg-surface-elevated text-muted'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated/60 text-muted"><tr><th className="px-4 py-3 text-left">Товар</th><th className="px-4 py-3 text-left">Склад</th><th className="px-4 py-3 text-right">Кількість</th><th className="px-4 py-3 text-right">Собівартість</th></tr></thead>
            <tbody>
              {stock.map((s, i) => (
                <tr key={i} className="border-t border-surface-border/50">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-muted">{s.warehouse_name}</td>
                  <td className={`px-4 py-3 text-right font-mono ${s.quantity <= 5 ? 'text-warning' : ''}`}>{s.quantity}</td>
                  <td className="px-4 py-3 text-right">{fmtUah(s.cost_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ops' && (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated/60 text-muted"><tr><th className="px-4 py-3 text-left">Тип</th><th className="px-4 py-3 text-left">Товар</th><th className="px-4 py-3 text-right">К-сть</th><th className="px-4 py-3 text-left">Склад</th></tr></thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id} className="border-t border-surface-border/50">
                  <td className="px-4 py-3">{o.type}</td>
                  <td className="px-4 py-3">{o.product_name}</td>
                  <td className="px-4 py-3 text-right font-mono">{o.quantity}</td>
                  <td className="px-4 py-3 text-muted">{o.warehouse_name}{o.target_warehouse_name ? ` → ${o.target_warehouse_name}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'action' && (
        <form onSubmit={submit} className="glass max-w-lg space-y-3 p-6">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
            <option value="receipt">Надходження</option>
            <option value="writeoff">Списання</option>
            <option value="adjustment">Коригування</option>
            <option value="transfer">Переміщення</option>
          </select>
          <select required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
            <option value="">Склад</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {form.type === 'transfer' && (
            <select required value={form.target_warehouse_id} onChange={(e) => setForm({ ...form, target_warehouse_id: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              <option value="">Цільовий склад</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
          <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
            <option value="">Товар</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input required type="number" step="0.001" placeholder="Кількість" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />
          {(form.type === 'receipt') && <input type="number" step="0.01" placeholder="Собівартість" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm" />}
          <button className="w-full rounded-xl bg-accent py-2 text-sm font-medium">Виконати</button>
        </form>
      )}
    </div>
  );
}
