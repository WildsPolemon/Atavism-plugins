import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

export default function Purchases() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', warehouse_id: '', notes: '', items: [{ product_id: '', quantity: 1, cost: 0 }] });

  const load = () => api.purchases().then((r) => setOrders(r.orders || []));
  useEffect(() => {
    load();
    api.suppliers().then((r) => setSuppliers(r.suppliers || []));
    api.warehouses().then((r) => setWarehouses(r.warehouses || []));
    api.products(1).then((r) => setProducts(r.products || []));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.createPurchase({
      ...form,
      supplier_id: form.supplier_id ? +form.supplier_id : null,
      warehouse_id: +form.warehouse_id,
      items: form.items.filter((i) => i.product_id).map((i) => ({ product_id: +i.product_id, quantity: +i.quantity, cost: +i.cost })),
    });
    setShow(false);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Закупівлі</h1>
          <p className="text-sm text-muted">Замовлення постачальникам (як AinurPOS)</p>
        </div>
        <button onClick={() => setShow(true)} className="rounded-xl bg-accent px-4 py-2 text-sm font-medium">Нове замовлення</button>
      </div>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="glass flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Замовлення #{o.id} · {o.supplier_name || '—'}</p>
              <p className="text-sm text-muted">{o.warehouse_name} · {fmtUah(o.total)} · {o.status}</p>
            </div>
            {o.status === 'draft' && (
              <button onClick={async () => { await api.receivePurchase(o.id); load(); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm">Отримати на склад</button>
            )}
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={save} className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h3 className="mb-4 text-lg font-bold">Замовлення постачальнику</h3>
            <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              <option value="">Постачальник</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="mb-3 w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm">
              <option value="">Склад</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {form.items.map((it, idx) => (
              <div key={idx} className="mb-2 grid grid-cols-3 gap-2">
                <select value={it.product_id} onChange={(e) => { const items = [...form.items]; items[idx].product_id = e.target.value; setForm({ ...form, items }); }} className="rounded-xl border border-surface-border bg-surface-elevated px-2 py-2 text-sm col-span-2">
                  <option value="">Товар</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="К-сть" value={it.quantity} onChange={(e) => { const items = [...form.items]; items[idx].quantity = e.target.value; setForm({ ...form, items }); }} className="rounded-xl border border-surface-border bg-surface-elevated px-2 py-2 text-sm" />
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, cost: 0 }] })} className="mb-4 text-sm text-accent">+ Товар</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShow(false)} className="flex-1 rounded-xl border py-2 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-2 text-sm font-medium">Створити</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
