import { useEffect, useState } from 'react';
import { api, fmt, getToken, setToken } from './api';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [held, setHeld] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null));
    api.shift().then((r) => setShift(r.shift)).catch(() => {});
  }, []);

  const login = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const r = await api.login(fd.get('email'), fd.get('password'));
      setToken(r.token);
      setUser(r.user);
      const s = await api.shift();
      setShift(s.shift);
      setErr('');
    } catch (ex) {
      setErr(ex.message);
    }
  };

  const openShift = async () => {
    const r = await api.openShift(0);
    setShift(r.shift || r);
    setMsg('Зміну відкрито');
  };

  const search = async () => {
    if (!q.trim()) return;
    const r = await api.searchProducts(q);
    setItems(r.products || []);
  };

  const add = (p) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.product_id === p.id);
      if (i >= 0) {
        const n = [...c];
        n[i] = { ...n[i], qty: n[i].qty + 1 };
        return n;
      }
      return [...c, { product_id: p.id, name: p.name, price: priceOf(p), qty: 1 }];
    });
    setQ('');
    setItems([]);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const pay = async () => {
    if (!cart.length) return;
    try {
      await api.sale({
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })),
        payment_cash: Number(cash) || 0,
        payment_card: Number(card) || 0,
      });
      setCart([]);
      setCash('');
      setCard('');
      setMsg('Продаж оформлено ✓');
      setErr('');
    } catch (ex) {
      setErr(ex.message);
    }
  };

  const hold = async () => {
    if (!cart.length) return;
    await api.holdSale({
      items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })),
    });
    setCart([]);
    setMsg('Чек відкладено');
    loadHeld();
  };

  const loadHeld = async () => {
    const r = await api.heldSales();
    setHeld(r.sales || []);
  };

  const restoreHeld = async (id) => {
    const h = held.find((x) => x.id === id);
    if (!h) return;
    setCart((h.items || []).map((i) => ({
      product_id: i.product_id,
      name: i.name,
      price: Number(i.price),
      qty: Number(i.qty),
    })));
    await api.deleteHeld(id);
    loadHeld();
    setMsg('Чек відновлено');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] p-6">
        <form onSubmit={login} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">StarNet Core</h1>
          <p className="text-violet-400 text-sm mb-6">Касовий термінал</p>
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
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div>
          <span className="font-bold text-lg">StarNet Core</span>
          <span className="text-slate-500 ml-3 text-sm">Каса · {user.name}</span>
        </div>
        <div className="flex gap-3 items-center">
          {shift ? (
            <span className="text-emerald-400 text-sm">Зміна #{shift.id} відкрита</span>
          ) : (
            <button onClick={openShift} className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium">Відкрити зміну</button>
          )}
          <button onClick={() => { setToken(null); setUser(null); }} className="text-slate-500 text-sm">Вихід</button>
        </div>
      </header>

      {msg && <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm">{msg}</div>}
      {err && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{err}</div>}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Штрихкод або назва товару..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700"
              autoFocus
            />
            <button onClick={search} className="px-6 py-3 rounded-xl bg-violet-600 font-medium">Пошук</button>
          </div>
          {items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {items.map((p) => (
                <button key={p.id} onClick={() => add(p)} className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500">
                  {p.image_url && <img src={p.image_url} alt="" className="w-full h-20 object-contain mb-2 rounded" />}
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-violet-400">{fmt(priceOf(p))}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <h2 className="font-semibold mb-3">Кошик</h2>
          <div className="flex-1 overflow-auto space-y-2 mb-4">
            {cart.map((i) => (
              <div key={i.product_id} className="flex justify-between text-sm py-2 border-b border-slate-800">
                <span className="truncate flex-1">{i.name} × {i.qty}</span>
                <span className="text-violet-400 ml-2">{fmt(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="text-2xl font-bold mb-4">Разом: {fmt(total)}</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input value={cash} onChange={(e) => setCash(e.target.value)} placeholder="Готівка" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
            <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="Картка" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={hold} disabled={!cart.length} className="py-3 rounded-xl bg-slate-700 disabled:opacity-40">Відкласти</button>
            <button onClick={pay} disabled={!cart.length || !shift} className="py-3 rounded-xl bg-violet-600 font-semibold disabled:opacity-40">Оплатити</button>
          </div>
          <button onClick={loadHeld} className="mt-3 text-sm text-slate-500">Відкладені чеки ({held.length})</button>
          {held.map((h) => (
            <button key={h.id} onClick={() => restoreHeld(h.id)} className="mt-2 w-full text-left p-2 rounded-lg bg-slate-800 text-sm">
              Чек #{h.id} · {fmt(h.total)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
