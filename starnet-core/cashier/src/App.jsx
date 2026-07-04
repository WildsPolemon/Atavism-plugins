import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, User, Menu, Trash2, PauseCircle, RotateCcw, BarChart3, LogOut, X } from 'lucide-react';
import { api, fmt, getToken, setToken } from './api';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [customerQ, setCustomerQ] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [xz, setXz] = useState(null);
  const [held, setHeld] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [payOpen, setPayOpen] = useState(false);
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [err, setErr] = useState('');
  const searchRef = useRef(null);

  const loadCatalog = useCallback((cat = categoryId) => {
    api.products(cat || undefined).then((r) => setCatalog(r.products || []));
  }, [categoryId]);

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null));
    api.shift().then((r) => setShift(r.shift)).catch(() => {});
    api.categories().then((r) => setCategories(r.categories || []));
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => { if (user) loadCatalog(); }, [categoryId, user, loadCatalog]);

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

  const addToCart = (p) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.product_id === p.id);
      if (i >= 0) {
        const n = [...c];
        n[i] = { ...n[i], qty: n[i].qty + 1 };
        return n;
      }
      return [...c, { product_id: p.id, name: p.name, price: priceOf(p), qty: 1, disc: 0 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart((c) => c.filter((x) => x.product_id !== id));
    else setCart((c) => c.map((x) => (x.product_id === id ? { ...x, qty } : x)));
  };

  const removeLine = (id) => setCart((c) => c.filter((x) => x.product_id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty - (i.disc || 0), 0);
  const customerDisc = customer?.discount_percent ? subtotal * customer.discount_percent / 100 : 0;
  const total = Math.max(0, subtotal - customerDisc);

  const onSearch = async () => {
    const query = q.trim();
    if (!query) { loadCatalog(); return; }
    if (/^\d{4,}$/.test(query)) {
      try {
        const r = await api.barcode(query);
        if (r.product_id) {
          addToCart({ id: r.product_id, name: r.name, sale_price: r.retail_price, retail_price: r.retail_price });
          setQ('');
          return;
        }
      } catch { /* continue */ }
    }
    const r = await api.searchProducts(query);
    setCatalog(r.products || []);
    setCustomers(r.customers || []);
  };

  const onCustomerSearch = async () => {
    if (!customerQ.trim()) return;
    const r = await api.searchProducts(customerQ);
    setCustomers(r.customers || []);
  };

  const openShift = async () => {
    const r = await api.openShift(0);
    setShift(r.shift || r);
    setMenuOpen(false);
  };

  const pay = async () => {
    if (!cart.length || !shift) return;
    try {
      await api.sale({
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price, discount: i.disc || 0 })),
        payment_cash: Number(cash) || total,
        payment_card: Number(card) || 0,
        customer_id: customer?.id,
      });
      setCart([]);
      setCustomer(null);
      setPayOpen(false);
      setCash('');
      setCard('');
    } catch (ex) { setErr(ex.message); }
  };

  const hold = async () => {
    if (!cart.length) return;
    await api.holdSale({ items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })) });
    setCart([]);
    setMenuOpen(false);
  };

  /* ——— Login (як web.ainur.app/pos) ——— */
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pos-bg px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pos-header text-2xl font-bold text-white">S</div>
          <h1 className="text-xl font-semibold text-pos-text">StarNet Core</h1>
          <p className="text-sm text-pos-muted">Точка продаж</p>
        </div>
        <form onSubmit={login} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-card border border-pos-border">
          <h2 className="mb-6 text-center text-lg font-medium">Авторизація</h2>
          {err && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
          <input name="email" type="email" defaultValue="cashier@starnetcore.local" placeholder="Email" className="mb-3 w-full rounded border border-pos-border px-4 py-3 text-sm focus:border-pos-header focus:outline-none" />
          <input name="password" type="password" defaultValue="cashier123" placeholder="Пароль" className="mb-6 w-full rounded border border-pos-border px-4 py-3 text-sm focus:border-pos-header focus:outline-none" />
          <button type="submit" className="w-full rounded bg-pos-header py-3 text-sm font-semibold text-white hover:opacity-90">Увійти</button>
        </form>
      </div>
    );
  }

  /* ——— POS (layout як AinurPOS web: сітка зліва, кошик справа) ——— */
  return (
    <div className="flex h-screen flex-col bg-pos-bg">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-pos-header px-4 py-2.5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-semibold">StarNet Core POS</span>
          {shift ? (
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs">Зміна #{shift.id}</span>
          ) : (
            <button onClick={openShift} className="rounded bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30">Відкрити зміну</button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-90">{user.name}</span>
          <button onClick={() => setToken(null)} className="rounded p-1.5 hover:bg-white/20" title="Вихід"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — products */}
        <div className="flex flex-1 flex-col border-r border-pos-border bg-pos-bg">
          <div className="flex items-center gap-2 border-b border-pos-border bg-white px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pos-muted" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Пошук товару..."
                className="w-full rounded border border-pos-border py-2.5 pl-10 pr-4 text-sm focus:border-pos-header focus:outline-none"
              />
            </div>
            <button onClick={onSearch} className="rounded bg-pos-header px-5 py-2.5 text-sm font-medium text-white">Знайти</button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-pos-border bg-white px-4 py-2">
            <button onClick={() => setCategoryId('')} className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${!categoryId ? 'bg-pos-header text-white' : 'bg-gray-100 text-pos-muted'}`}>Усі</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(String(c.id))} className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${categoryId === String(c.id) ? 'bg-pos-header text-white' : 'bg-gray-100 text-pos-muted'}`}>{c.name}</button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {catalog.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex flex-col rounded-lg border border-pos-border bg-white p-3 text-left shadow-card transition hover:border-pos-header hover:shadow-md"
                >
                  <div className="mb-2 flex h-24 items-center justify-center rounded bg-gray-50">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-3xl text-gray-300">📦</span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs font-medium leading-tight">{p.name}</p>
                  <p className="mt-1 text-sm font-bold text-pos-header">{fmt(priceOf(p))}</p>
                  {p.stock_qty != null && <p className="text-[10px] text-pos-muted">{p.stock_qty} {p.unit || 'шт'}</p>}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 border-t border-pos-border bg-white px-4 py-3 text-sm text-pos-muted hover:bg-gray-50">
            <Menu className="h-5 w-5" /> Меню
          </button>
        </div>

        {/* RIGHT — cart (як AinurPOS: таблиця + зелена кнопка TOTAL) */}
        <div className="flex w-full max-w-md flex-col bg-white lg:max-w-lg xl:max-w-xl">
          <div className="border-b border-pos-border p-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
              <input
                value={customer ? customer.name : customerQ}
                onChange={(e) => { setCustomerQ(e.target.value); setCustomer(null); }}
                onKeyDown={(e) => e.key === 'Enter' && onCustomerSearch()}
                placeholder="Ім'я клієнта"
                className="w-full rounded border border-pos-border py-2.5 pl-10 pr-4 text-sm focus:border-pos-header focus:outline-none"
              />
            </div>
            {customers.length > 0 && !customer && (
              <div className="mt-2 max-h-32 overflow-auto rounded border border-pos-border">
                {customers.map((c) => (
                  <button key={c.id} onClick={() => { setCustomer(c); setCustomers([]); setCustomerQ(''); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {c.name} {c.phone && <span className="text-pos-muted">· {c.phone}</span>}
                    {c.discount_percent > 0 && <span className="ml-1 text-pos-accent">-{c.discount_percent}%</span>}
                  </button>
                ))}
              </div>
            )}
            {customer && (
              <div className="mt-2 flex items-center justify-between rounded bg-amber-50 px-3 py-2 text-sm">
                <span>{customer.name}</span>
                <button onClick={() => setCustomer(null)} className="text-pos-muted hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs text-pos-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Товар</th>
                  <th className="px-2 py-2 text-right font-medium">Ціна</th>
                  <th className="px-2 py-2 text-center font-medium">К-сть</th>
                  <th className="px-2 py-2 text-right font-medium">Сума</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.product_id} className="border-t border-pos-border">
                    <td className="px-3 py-2.5 font-medium leading-tight">{i.name}</td>
                    <td className="px-2 py-2.5 text-right text-pos-muted">{fmt(i.price)}</td>
                    <td className="px-2 py-2.5 text-center">
                      <input
                        type="number"
                        min="1"
                        value={i.qty}
                        onChange={(e) => updateQty(i.product_id, Number(e.target.value))}
                        className="w-12 rounded border border-pos-border px-1 py-0.5 text-center text-sm"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold">{fmt(i.price * i.qty)}</td>
                    <td className="px-1 py-2.5">
                      <button onClick={() => removeLine(i.product_id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!cart.length && <p className="p-8 text-center text-sm text-pos-muted">Додайте товари зліва</p>}
          </div>

          <div className="border-t border-pos-border p-4">
            <div className="mb-2 flex justify-between text-sm"><span className="text-pos-muted">Підсумок</span><span>{fmt(subtotal)}</span></div>
            {customerDisc > 0 && <div className="mb-2 flex justify-between text-sm text-pos-accent"><span>Знижка клієнта</span><span>-{fmt(customerDisc)}</span></div>}
            <button
              onClick={() => setPayOpen(true)}
              disabled={!cart.length || !shift}
              className="flex w-full items-center justify-between rounded-lg bg-pos-accent px-5 py-4 text-lg font-bold text-white shadow-md transition hover:bg-green-600 disabled:opacity-40"
            >
              <span>РАЗОМ</span>
              <span>{fmt(total)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3 font-semibold">
              Меню <button onClick={() => setMenuOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1 p-2">
              {!shift && <button onClick={openShift} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-gray-50">Відкрити зміну</button>}
              <button onClick={hold} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-gray-50"><PauseCircle className="h-4 w-4" /> Відкласти чек</button>
              <button onClick={async () => { setHeld((await api.heldSales()).sales || []); setPanel('held'); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-gray-50"><PauseCircle className="h-4 w-4" /> Відкладені</button>
              <button onClick={async () => { setXz(await api.xzReport('X')); setPanel('xz'); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-gray-50"><BarChart3 className="h-4 w-4" /> X-звіт</button>
              <button onClick={async () => { setRecentSales((await api.sales('completed')).sales || []); setPanel('returns'); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-gray-50"><RotateCcw className="h-4 w-4" /> Повернення</button>
              <button onClick={async () => { await api.closeShift(0); setShift(null); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 hover:bg-red-50">Закрити зміну</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Оплата · {fmt(total)}</h3>
            <input value={cash} onChange={(e) => setCash(e.target.value)} placeholder="Готівка" className="mb-3 w-full rounded border border-pos-border px-4 py-3 text-sm" />
            <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="Картка" className="mb-4 w-full rounded border border-pos-border px-4 py-3 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setPayOpen(false)} className="flex-1 rounded border py-3 text-sm">Скасувати</button>
              <button onClick={pay} className="flex-1 rounded bg-pos-accent py-3 text-sm font-semibold text-white">Підтвердити</button>
            </div>
          </div>
        </div>
      )}

      {/* Panels */}
      {panel === 'held' && (
        <Modal title="Відкладені чеки" onClose={() => setPanel(null)}>
          {held.map((h) => (
            <button key={h.id} onClick={async () => {
              setCart((h.items || []).map((i) => ({ product_id: i.product_id, name: i.name, price: Number(i.price), qty: Number(i.qty), disc: 0 })));
              await api.deleteHeld(h.id);
              setPanel(null);
            }} className="flex w-full justify-between border-b py-3 text-sm hover:bg-gray-50">
              <span>Чек #{h.id}</span><span className="font-semibold">{fmt(h.total)}</span>
            </button>
          ))}
        </Modal>
      )}
      {panel === 'xz' && xz && (
        <Modal title="X-звіт" onClose={() => setPanel(null)}>
          <p className="text-sm">Чеків: {xz.sales?.count}</p>
          <p className="text-sm">Сума: {fmt(xz.sales?.total)}</p>
          <p className="text-sm">Готівка: {fmt(xz.sales?.cash)} · Картка: {fmt(xz.sales?.card)}</p>
        </Modal>
      )}
      {panel === 'returns' && (
        <Modal title="Повернення" onClose={() => setPanel(null)}>
          {recentSales.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b py-3 text-sm">
              <span>#{s.id} · {fmt(s.total)}</span>
              <button onClick={async () => { await api.returnSale(s.id); setPanel(null); }} className="rounded bg-red-100 px-3 py-1 text-xs text-red-700">Повернути</button>
            </div>
          ))}
        </Modal>
      )}

      {err && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white" onClick={() => setErr('')}>{err}</div>}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
