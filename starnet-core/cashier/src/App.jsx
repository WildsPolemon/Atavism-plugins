import { useEffect, useState, useRef, useCallback } from 'react';
import { Menu, ScanBarcode, User, Search } from 'lucide-react';
import { api, getToken, setToken } from './api';
import { fmt } from './utils';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import CartPanel from './components/CartPanel';
import FooterBar from './components/FooterBar';
import SideMenu from './components/SideMenu';
import PaymentScreen from './components/PaymentScreen';
import ItemEditModal from './components/ItemEditModal';
import CustomerModal from './components/CustomerModal';
import ReceiptJournal from './components/ReceiptJournal';
import ReceiptPrint from './components/ReceiptPrint';
import PosSettings from './components/PosSettings';
import BarcodeModal from './components/BarcodeModal';
import ProductAddModal from './components/ProductAddModal';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [settings, setSettings] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQ, setCustomerQ] = useState('');
  const [customers, setCustomers] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [productAddOpen, setProductAddOpen] = useState(null);
  const [sales, setSales] = useState([]);
  const [held, setHeld] = useState([]);
  const [lastSale, setLastSale] = useState(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [saleComment, setSaleComment] = useState('');
  const [err, setErr] = useState('');
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const loadCatalog = useCallback(() => {
    const sort = settings.pos_sort_by || 'name';
    const dir = settings.pos_sort_dir || 'asc';
    const loader = q.trim() ? api.searchProducts(q.trim()) : api.products(categoryId || undefined);
    loader.then((r) => {
      let products = r.products || [];
      if (settings.pos_show_zero_stock === '0') products = products.filter((p) => (p.stock_qty ?? 0) > 0);
      products.sort((a, b) => {
        const av = a[sort] ?? a.name, bv = b[sort] ?? b.name;
        if (typeof av === 'number') return dir === 'asc' ? av - bv : bv - av;
        return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
      setCatalog(products);
    });
  }, [categoryId, q, settings.pos_sort_by, settings.pos_sort_dir, settings.pos_show_zero_stock]);

  const loadSuggestions = useCallback(() => {
    const ids = cart.map((c) => c.product_id).join(',');
    api.recommendations(ids).then((r) => {
      const list = (r.products || []).filter((p) => !cart.find((c) => c.product_id === p.id));
      setSuggestions(list.slice(0, 6));
    }).catch(() => setSuggestions([]));
  }, [cart]);

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null));
    api.shift().then((r) => setShift(r.shift)).catch(() => {});
    api.receiptSettings().then((r) => setSettings(r.settings || {}));
    api.categories().then((r) => setCategories(r.categories || []));
  }, []);

  useEffect(() => { if (user) loadCatalog(); }, [categoryId, user, loadCatalog]);
  useEffect(() => { if (user) loadSuggestions(); }, [cart, user, loadSuggestions]);

  useEffect(() => {
    if (!user) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(loadCatalog, 300);
    return () => clearTimeout(searchTimer.current);
  }, [q, user, loadCatalog]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false); setPayOpen(false); setCustomerOpen(false); setEditItem(null);
        setJournalOpen(false); setSettingsOpen(false); setBarcodeOpen(false); setProductAddOpen(null); setCommentOpen(false);
      }
      if (e.key === 'f' || e.key === 'F') { if (!payOpen && !customerOpen && !settingsOpen) { e.preventDefault(); searchRef.current?.focus(); } }
      if (e.key === 'c' || e.key === 'C') { if (!payOpen && !settingsOpen) { e.preventDefault(); setCustomerOpen(true); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [payOpen, customerOpen, settingsOpen]);

  const login = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const r = await api.login(fd.get('email'), fd.get('password'));
      setToken(r.token);
      setUser(r.user);
      const s = await api.shift();
      setShift(s.shift);
      if (!s.shift) await api.openShift(0).then((r) => setShift(r.shift || r));
    } catch (ex) { setErr(ex.message); }
  };

  const addToCart = (p) => {
    if (settings.pos_sound !== 'off') try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2d').play(); } catch { /* */ }
    setCart((c) => {
      const i = c.findIndex((x) => x.product_id === p.id);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + 1 }; return n; }
      return [...c, { product_id: p.id, name: p.name, price: priceOf(p), qty: 1, disc: 0 }];
    });
  };

  const setQty = (id, qty) => {
    if (qty <= 0) setCart((c) => c.filter((x) => x.product_id !== id));
    else setCart((c) => c.map((x) => (x.product_id === id ? { ...x, qty } : x)));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty - (i.disc || 0), 0);
  const custDiscPct = customer?.discount_percent || 0;
  const custDiscAmt = subtotal * custDiscPct / 100;
  const total = Math.max(0, subtotal - custDiscAmt);

  const scanBarcode = async (code) => {
    try {
      const r = await api.barcode(code);
      if (r.product_id) { addToCart({ id: r.product_id, name: r.name, sale_price: r.retail_price, retail_price: r.retail_price }); setBarcodeOpen(false); setQ(''); }
      else setProductAddOpen(code);
    } catch { setProductAddOpen(code); }
  };

  const createProduct = async (data) => {
    const p = await api.createProduct(data);
    addToCart(p);
    setProductAddOpen(null);
    loadCatalog();
  };

  const completePay = async ({ payment_cash, payment_card, payment_deferred, notes, print_receipt }) => {
    const sale = await api.sale({
      items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price, discount: i.disc || 0 })),
      payment_cash: payment_cash || 0,
      payment_card: payment_card || 0,
      payment_deferred: payment_deferred || 0,
      customer_id: customer?.id,
      notes: notes || saleComment,
    });
    setLastSale({ sale: { ...sale, payment_cash, payment_card, payment_deferred, total, created_at: new Date().toLocaleString('uk-UA') }, items: [...cart] });
    setCart([]); setSaleComment('');
    if (payment_deferred > 0 && customer) setCustomer({ ...customer, debt: Number(customer.debt || 0) + payment_deferred });
    else setCustomer(null);
    setPayOpen(false);
    if (print_receipt) setTimeout(() => window.print(), 100);
  };

  const menuAction = async (id) => {
    if (id === 'logout') { setToken(null); setUser(null); }
    if (id === 'close-shift') { await api.closeShift(0); setShift(null); }
    if (id === 'journal') { setSales((await api.sales()).sales || []); setJournalOpen(true); }
    if (id === 'return') { setSales((await api.sales('completed')).sales || []); setJournalOpen(true); }
    if (id === 'hold' && cart.length) { await api.holdSale({ items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })) }); setCart([]); }
    if (id === 'held') { setHeld((await api.heldSales()).sales || []); }
    if (id === 'settings') setSettingsOpen(true);
    if (id === 'add-product') setProductAddOpen('');
    if (id === 'xz') { const r = await api.xzReport('X'); alert(`X-звіт: ${r.sales?.count} чеків, ${fmt(r.sales?.total)}`); }
    if (id === 'cancel' && cart.length) setCart([]);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ainur-bg px-4">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-ainur-blue text-2xl font-bold text-white">A</div>
          <h1 className="text-xl font-semibold">StarNet Core</h1>
          <p className="text-sm text-ainur-muted">Точка продаж</p>
        </div>
        <form onSubmit={login} className="w-full max-w-sm rounded-lg border border-ainur-border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-center text-lg font-medium">Авторизація</h2>
          {err && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
          <input name="email" type="email" defaultValue="cashier@starnetcore.local" placeholder="Email" className="mb-3 w-full rounded border border-ainur-border px-4 py-3 text-sm" />
          <input name="password" type="password" defaultValue="cashier123" placeholder="Пароль" className="mb-6 w-full rounded border border-ainur-border px-4 py-3 text-sm" />
          <button type="submit" className="w-full rounded-lg bg-ainur-blue py-3 text-sm font-semibold text-white">Увійти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ainur-bg">
      <header className="flex h-header shrink-0 items-center gap-2 bg-ainur-blue px-3 text-white">
        <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-white/10">
          <Menu className="h-6 w-6" />
        </button>
        <span className="hidden shrink-0 text-lg font-bold sm:block">StarNet POS</span>
        <div className="relative mx-2 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ainur-muted" />
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук за найменуванням, артикулом, штрихкодом, кодом та описом"
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-12 text-sm text-ainur-text focus:outline-none focus:ring-2 focus:ring-ainur-orange" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-gray-200 px-1.5 text-[10px] text-ainur-muted">F</span>
        </div>
        <button type="button" onClick={() => setBarcodeOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25">
          <ScanBarcode className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => setCustomerOpen(true)} className="hidden items-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25 sm:flex">
          Клієнт <span className="rounded bg-white/20 px-1 text-[10px]">C</span>
        </button>
        <button type="button" onClick={() => setCustomerOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ainur-orange">
          <User className="h-5 w-5" />
        </button>
      </header>

      <CategoryTabs categories={categories} categoryId={categoryId} setCategoryId={setCategoryId} productCount={catalog.length} />

      <div className="flex flex-1 overflow-hidden">
        <ProductGrid products={catalog} cart={cart} onAdd={addToCart} onQty={setQty} />
        <CartPanel cart={cart} customer={customer} onChangeCustomer={() => setCustomerOpen(true)}
          suggestions={suggestions} subtotal={subtotal} discountPct={custDiscPct} discountAmt={custDiscAmt} total={total}
          onRemove={(id) => setCart((c) => c.filter((x) => x.product_id !== id))} onEdit={setEditItem} onAddSuggestion={addToCart} />
      </div>

      <FooterBar storeName={settings.company_name || 'StarNet Core'} shift={shift} total={total} userName={user?.name}
        onMenu={() => setMenuOpen(true)} onSale={() => shift && cart.length ? setPayOpen(true) : setErr('Відкрийте зміну або додайте товари')}
        onHold={() => cart.length && menuAction('hold')} onCancel={() => cart.length && menuAction('cancel')}
        onComment={() => setCommentOpen(true)} cartEmpty={!cart.length} />

      {menuOpen && <SideMenu user={user} onClose={() => setMenuOpen(false)} onAction={menuAction} />}
      {payOpen && <PaymentScreen total={total} customer={customer} printDefault={settings.pos_print_default !== '0'} onClose={() => setPayOpen(false)} onPay={completePay} />}
      {editItem && <ItemEditModal item={editItem} onClose={() => setEditItem(null)} onSave={(u) => { setCart((c) => c.map((x) => x.product_id === u.product_id ? u : x)); setEditItem(null); }} />}
      {customerOpen && <CustomerModal query={customerQ} setQuery={setCustomerQ} customers={customers}
        onSearch={async () => setCustomers((await api.searchCustomers(customerQ)).customers || [])}
        onSelect={(c) => { setCustomer(c); setCustomerOpen(false); }}
        onCreate={async (data) => { const c = await api.createCustomer(data); setCustomer(c); setCustomerOpen(false); }}
        onClose={() => setCustomerOpen(false)} />}
      {journalOpen && <ReceiptJournal sales={sales} onClose={() => setJournalOpen(false)} onReturn={async (id) => { await api.returnSale(id); setSales((await api.sales()).sales || []); }} />}
      {settingsOpen && <PosSettings settings={settings} onClose={() => setSettingsOpen(false)} onSave={async (s) => { const r = await api.updateSettings(s); setSettings(r.settings || s); setSettingsOpen(false); loadCatalog(); }} />}
      {barcodeOpen && <BarcodeModal onScan={scanBarcode} onClose={() => setBarcodeOpen(false)} />}
      {productAddOpen !== null && <ProductAddModal barcode={productAddOpen} categories={categories} onClose={() => setProductAddOpen(null)} onSave={createProduct} />}
      {lastSale && <ReceiptPrint sale={lastSale.sale} items={lastSale.items} settings={settings} customer={customer} cashier={user?.name} />}
      {commentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-3 font-semibold">Оскарження / коментар</h3>
            <textarea value={saleComment} onChange={(e) => setSaleComment(e.target.value)} rows={4} className="mb-4 w-full rounded-lg border border-ainur-border p-3 text-sm" placeholder="Введіть коментар до чека..." />
            <button type="button" onClick={() => setCommentOpen(false)} className="w-full rounded-lg bg-ainur-blue py-2 text-sm text-white">Зберегти</button>
          </div>
        </div>
      )}
      {held.length > 0 && (
        <div className="fixed bottom-20 left-4 z-30 rounded-lg border border-ainur-border bg-white p-3 shadow-lg text-sm">
          <p className="font-medium mb-2">Відкладені: {held.length}</p>
          {held.map((h) => (
            <button key={h.id} type="button" onClick={async () => {
              setCart((h.items || []).map((i) => ({ product_id: i.product_id, name: i.name, price: Number(i.price), qty: Number(i.qty), disc: 0 })));
              await api.deleteHeld(h.id); setHeld([]);
            }} className="block w-full text-left py-1 hover:text-ainur-blue">#{h.id} {fmt(h.total)}</button>
          ))}
        </div>
      )}
      {err && <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm text-white" onClick={() => setErr('')}>{err}</div>}
    </div>
  );
}
