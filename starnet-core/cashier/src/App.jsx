import { useEffect, useState, useRef } from 'react';
import { api, fmt, getToken, setToken } from './api';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

function ReceiptModal({ sale, settings, cart, customer, onClose }) {
  const items = sale?.items || cart;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div id="receipt-print" className="w-full max-w-sm rounded-xl bg-white p-6 text-black" onClick={(e) => e.stopPropagation()}>
        {settings?.receipt_logo && <img src={settings.receipt_logo} alt="" className="mx-auto mb-3 h-12 object-contain" />}
        <h2 className="text-center font-bold">{settings?.company_name || 'StarNet Core'}</h2>
        {settings?.site_url && <p className="text-center text-xs text-gray-500">{settings.site_url}</p>}
        <hr className="my-3" />
        {customer && <p className="text-sm mb-2">Клієнт: {customer.name}</p>}
        {items.map((i, idx) => (
          <div key={idx} className="flex justify-between text-sm py-1">
            <span>{i.name} ×{i.qty || i.quantity}</span>
            <span>{fmt((i.price || 0) * (i.qty || i.quantity || 1))}</span>
          </div>
        ))}
        <hr className="my-3" />
        <p className="text-right font-bold text-lg">{fmt(sale?.total || cart.reduce((s, i) => s + i.price * i.qty, 0))}</p>
        <p className="mt-4 text-center text-xs text-gray-500">{settings?.receipt_footer}</p>
        <button onClick={() => window.print()} className="mt-4 w-full rounded-lg bg-violet-600 py-2 text-white text-sm">Друк</button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [held, setHeld] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [panel, setPanel] = useState(null);
  const [xz, setXz] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [settings, setSettings] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null));
    api.shift().then((r) => setShift(r.shift)).catch(() => {});
    api.receiptSettings().then((r) => setSettings(r.settings || {})).catch(() => {});
  }, []);

  const login = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const r = await api.login(fd.get('email'), fd.get('password'));
      setToken(r.token);
      setUser(r.user);
      setShift((await api.shift()).shift);
      setErr('');
    } catch (ex) { setErr(ex.message); }
  };

  const openShift = async () => {
    const r = await api.openShift(0);
    setShift(r.shift || r);
    setMsg('Зміну відкрито');
  };

  const closeShift = async () => {
    await api.closeShift(Number(cash) || 0);
    setShift(null);
    setPanel(null);
    setMsg('Зміну закрито');
  };

  const search = async (query = q) => {
    if (!query.trim()) return;
    if (/^\d{4,}$/.test(query.trim())) {
      try {
        const r = await api.barcode(query.trim());
        if (r.product_id) {
          add({ id: r.product_id, name: r.name, sale_price: r.retail_price, retail_price: r.retail_price, image_url: r.image_url });
          setQ('');
          return;
        }
      } catch { /* fallback to search */ }
    }
    const r = await api.searchProducts(query);
    setItems(r.products || []);
    setCustomers(r.customers || []);
  };

  const add = (p) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.product_id === p.id);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + 1 }; return n; }
      return [...c, { product_id: p.id, name: p.name, price: priceOf(p), qty: 1 }];
    });
    setQ('');
    setItems([]);
    inputRef.current?.focus();
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0) - (customer?.discount_percent ? subtotal * customer.discount_percent / 100 : 0));

  const pay = async () => {
    if (!cart.length) return;
    try {
      const sale = await api.sale({
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })),
        payment_cash: Number(cash) || 0,
        payment_card: Number(card) || 0,
        discount: Number(discount) || 0,
        customer_id: customer?.id,
        notes,
      });
      setReceipt({ sale, cart: [...cart], customer });
      setCart([]);
      setCash('');
      setCard('');
      setDiscount('');
      setNotes('');
      setCustomer(null);
      setMsg('Продаж оформлено ✓');
    } catch (ex) { setErr(ex.message); }
  };

  const hold = async () => {
    if (!cart.length) return;
    await api.holdSale({ items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })), notes });
    setCart([]);
    setMsg('Чек відкладено');
    loadHeld();
  };

  const loadHeld = async () => setHeld((await api.heldSales()).sales || []);
  const loadReturns = async () => setRecentSales((await api.sales('completed')).sales || []);

  const restoreHeld = async (id) => {
    const h = held.find((x) => x.id === id);
    if (!h) return;
    setCart((h.items || []).map((i) => ({ product_id: i.product_id, name: i.name, price: Number(i.price), qty: Number(i.qty) })));
    await api.deleteHeld(id);
    loadHeld();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] p-6">
        <form onSubmit={login} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">StarNet Core</h1>
          <p className="text-violet-400 text-sm mb-6">Касовий термінал · POS</p>
          {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
          <input name="email" type="email" defaultValue="cashier@starnetcore.local" className="w-full mb-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
          <input name="password" type="password" defaultValue="cashier123" className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
          <button className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold">Увійти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div><span className="font-bold">StarNet Core POS</span><span className="text-slate-500 ml-2 text-sm">{user.name}</span></div>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {shift ? <span className="text-emerald-400">Зміна #{shift.id}</span> : <button onClick={openShift} className="px-3 py-1 rounded-lg bg-emerald-600">Відкрити зміну</button>}
          <button onClick={async () => { setXz(await api.xzReport('X')); setPanel('xz'); }} className="px-3 py-1 rounded-lg bg-slate-700">X-звіт</button>
          <button onClick={() => setPanel('close')} className="px-3 py-1 rounded-lg bg-slate-700">Закрити зміну</button>
          <button onClick={() => { loadReturns(); setPanel('returns'); }} className="px-3 py-1 rounded-lg bg-slate-700">Повернення</button>
          <button onClick={() => setToken(null)} className="text-slate-500">Вихід</button>
        </div>
      </header>

      {msg && <div className="mx-4 mt-3 p-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm">{msg}</div>}
      {err && <div className="mx-4 mt-3 p-2 rounded-lg bg-red-500/20 text-red-300 text-sm">{err}</div>}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 p-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Штрихкод, назва, телефон клієнта..." className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700" autoFocus />
            <button onClick={() => search()} className="px-5 py-3 rounded-xl bg-violet-600 font-medium">Пошук</button>
          </div>
          {customers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customers.map((c) => (
                <button key={c.id} onClick={() => { setCustomer(c); setCustomers([]); setItems([]); }} className="px-3 py-2 rounded-xl bg-indigo-900/50 border border-indigo-500/30 text-sm">
                  👤 {c.name} {c.discount_percent > 0 && `(-${c.discount_percent}%)`}
                </button>
              ))}
            </div>
          )}
          {customer && <div className="px-3 py-2 rounded-xl bg-indigo-500/20 text-sm">Клієнт: <b>{customer.name}</b> <button onClick={() => setCustomer(null)} className="ml-2 text-slate-400">×</button></div>}
          {items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {items.map((p) => (
                <button key={p.id} onClick={() => add(p)} className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500">
                  {p.image_url && <img src={p.image_url} alt="" className="w-full h-16 object-contain mb-1 rounded" />}
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-violet-400 text-sm">{fmt(priceOf(p))}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <h2 className="font-semibold mb-2">Кошик</h2>
          <div className="flex-1 overflow-auto space-y-1 mb-3 max-h-48">
            {cart.map((i) => (
              <div key={i.product_id} className="flex justify-between text-sm py-1 border-b border-slate-800">
                <span className="truncate flex-1">{i.name} ×{i.qty}</span>
                <span className="text-violet-400 ml-2">{fmt(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Примітка на чеку" className="mb-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Знижка (₴)" className="mb-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          <div className="text-xl font-bold mb-3">Разом: {fmt(total)}</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={cash} onChange={(e) => setCash(e.target.value)} placeholder="Готівка" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="Картка" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={hold} disabled={!cart.length} className="py-2.5 rounded-xl bg-slate-700 disabled:opacity-40 text-sm">Відкласти</button>
            <button onClick={pay} disabled={!cart.length || !shift} className="py-2.5 rounded-xl bg-violet-600 font-semibold disabled:opacity-40 text-sm">Оплатити</button>
          </div>
          <button onClick={loadHeld} className="mt-2 text-xs text-slate-500">Відкладені ({held.length})</button>
          {held.map((h) => (
            <button key={h.id} onClick={() => restoreHeld(h.id)} className="mt-1 w-full text-left p-2 rounded-lg bg-slate-800 text-xs">#{h.id} · {fmt(h.total)}</button>
          ))}
        </div>
      </div>

      {panel === 'xz' && xz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700">
            <h3 className="font-bold mb-4">X-звіт · Зміна #{xz.shift?.id}</h3>
            <p className="text-sm">Чеків: {xz.sales?.count}</p>
            <p className="text-sm">Сума: {fmt(xz.sales?.total)}</p>
            <p className="text-sm">Готівка: {fmt(xz.sales?.cash)} · Картка: {fmt(xz.sales?.card)}</p>
            <button onClick={() => setPanel(null)} className="mt-4 w-full py-2 rounded-xl bg-violet-600">Закрити</button>
          </div>
        </div>
      )}

      {panel === 'close' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700">
            <h3 className="font-bold mb-4">Закриття зміни</h3>
            <input value={cash} onChange={(e) => setCash(e.target.value)} placeholder="Готівка в касі" className="w-full mb-4 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700" />
            <button onClick={closeShift} className="w-full py-2 rounded-xl bg-rose-600">Закрити зміну</button>
            <button onClick={() => setPanel(null)} className="mt-2 w-full py-2 text-sm text-slate-500">Скасувати</button>
          </div>
        </div>
      )}

      {panel === 'returns' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-auto">
            <h3 className="font-bold mb-4">Повернення</h3>
            {recentSales.map((s) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-slate-800 text-sm">
                <span>#{s.id} · {fmt(s.total)}</span>
                <button onClick={async () => { await api.returnSale(s.id); setMsg('Повернення оформлено'); loadReturns(); }} className="px-3 py-1 rounded-lg bg-rose-600 text-xs">Повернути</button>
              </div>
            ))}
            <button onClick={() => setPanel(null)} className="mt-4 w-full py-2 rounded-xl bg-slate-700">Закрити</button>
          </div>
        </div>
      )}

      {receipt && <ReceiptModal sale={receipt.sale} settings={settings} cart={receipt.cart} customer={receipt.customer} onClose={() => setReceipt(null)} />}
    </div>
  );
}
