import { useEffect, useState, useRef, useCallback } from 'react';
import { FolderOpen, ScanBarcode, User, Mail, Lock, QrCode } from 'lucide-react';
import { api, getToken, setToken } from './api';
import { fmt } from './utils';
import { printReceipt, readScaleWeight } from './utils/hardware';
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
import ShiftsModal from './components/ShiftsModal';
import XZReportModal from './components/XZReportModal';
import DebtReturnModal from './components/DebtReturnModal';
import CloseShiftModal from './components/CloseShiftModal';
import RegisterSelectModal from './components/RegisterSelectModal';
import OpenShiftModal from './components/OpenShiftModal';

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
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
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
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [xzOpen, setXzOpen] = useState(false);
  const [xzReport, setXzReport] = useState(null);
  const [xzType, setXzType] = useState('X');
  const [debtOpen, setDebtOpen] = useState(false);
  const [debtors, setDebtors] = useState([]);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [registerSelectOpen, setRegisterSelectOpen] = useState(false);
  const [openShiftModal, setOpenShiftModal] = useState(null);
  const [myRegisters, setMyRegisters] = useState([]);
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
      setSuggestions((r.products || []).filter((p) => !cart.find((c) => c.product_id === p.id)).slice(0, 4));
    }).catch(() => setSuggestions([]));
  }, [cart]);

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null));
    api.shift().then((r) => setShift(r.shift)).catch(() => {});
    api.receiptSettings().then((r) => setSettings(r.settings || {}));
    api.categories().then((r) => setCategories(r.categories || []));
  }, []);

  useEffect(() => {
    if (user && !shift && getToken()) {
      api.shift().then((r) => {
        if (!r.shift) startShiftFlow();
        else setShift(r.shift);
      }).catch(() => {});
    }
  }, [user]);
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
        setMenuOpen(false); setPayOpen(false); setCustomerOpen(false); setNewCustomerOpen(false);
        setEditItem(null); setJournalOpen(false); setSettingsOpen(false); setBarcodeOpen(false);
        setProductAddOpen(null); setCommentOpen(false); setShiftsOpen(false); setXzOpen(false);
        setDebtOpen(false); setCloseShiftOpen(false); setRegisterSelectOpen(false); setOpenShiftModal(null);
      }
      if (e.key === 'f' || e.key === 'F') { if (!payOpen && !customerOpen && !settingsOpen) { e.preventDefault(); searchRef.current?.focus(); } }
      if (e.key === 'c' || e.key === 'C') { if (!payOpen && !settingsOpen) { e.preventDefault(); setCustomerOpen(true); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [payOpen, customerOpen, settingsOpen]);

  const startShiftFlow = async () => {
    const r = await api.myRegisters();
    const regs = r.registers || [];
    setMyRegisters(regs);
    const available = regs.filter((x) => !x.open_shift);
    if (!available.length) { setErr('Немає вільних кас'); return; }
    if (available.length === 1) { setOpenShiftModal(available[0]); return; }
    setRegisterSelectOpen(true);
  };

  const login = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const r = await api.login(fd.get('email'), fd.get('password'));
      setToken(r.token);
      setUser(r.user);
      const s = await api.shift();
      setShift(s.shift);
      if (!s.shift) await startShiftFlow();
    } catch (ex) { setErr(ex.message); }
  };

  const confirmOpenShift = async (openingCash) => {
    const reg = openShiftModal;
    const opened = await api.openShift(reg.id, openingCash);
    setShift(opened.shift || opened);
    setOpenShiftModal(null);
    setRegisterSelectOpen(false);
  };

  const addToCart = async (p) => {
    let qty = 1;
    if (p.is_weighted && settings.pos_scale_enabled === '1') {
      try {
        const w = await readScaleWeight(settings);
        if (w > 0) qty = w;
      } catch { /* use qty 1 */ }
    }
    setCart((c) => {
      const i = c.findIndex((x) => x.product_id === p.id);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
      return [...c, { product_id: p.id, name: p.name, price: priceOf(p), qty, disc: 0 }];
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

  const openSale = () => {
    if (!shift) { setErr('Відкрийте зміну'); return; }
    if (!cart.length) { setErr('Додайте товари'); return; }
    setPayOpen(true);
  };

  const completePay = async ({ payment_cash, payment_card, payment_deferred, notes, print_receipt }) => {
    const soldItems = [...cart];
    const sale = await api.sale({
      items: soldItems.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price, discount: i.disc || 0 })),
      payment_cash: payment_cash || 0, payment_card: payment_card || 0, payment_deferred: payment_deferred || 0,
      customer_id: customer?.id, notes: notes || saleComment,
    });
    setLastSale({ sale: { ...sale, payment_cash, payment_card, payment_deferred, total, created_at: new Date().toLocaleString('uk-UA') }, items: soldItems });
    setCart([]); setSaleComment('');
    if (payment_deferred > 0 && customer) setCustomer({ ...customer, debt: Number(customer.debt || 0) + payment_deferred });
    else setCustomer(null);
    setPayOpen(false);
    if (print_receipt) {
      if (settings.pos_printer_enabled === '1') {
        const lines = [
          settings.company_name || 'StarNet Core',
          settings.receipt_address || '',
          `Чек · ${new Date().toLocaleString('uk-UA')}`,
          ...soldItems.map((i) => `${i.name} x${i.qty} = ${fmt(i.price * i.qty)}`),
          `РАЗОМ: ${fmt(total)}`,
          settings.receipt_footer || '',
        ];
        printReceipt(settings, lines).catch(() => window.print());
      } else {
        setTimeout(() => window.print(), 100);
      }
    }
  };

  const cartAction = (id) => {
    if (id === 'hold' && cart.length) menuAction('hold');
    if (id === 'cancel' && cart.length) menuAction('cancel');
    if (id === 'comment') setCommentOpen(true);
  };

  const menuAction = async (id) => {
    if (id === 'logout') { setToken(null); setUser(null); }
    if (id === 'close-shift') {
      const r = await api.xzReport('Z');
      setXzReport(r); setCloseShiftOpen(true);
    }
    if (id === 'journal') { setSales((await api.sales()).sales || []); setJournalOpen(true); }
    if (id === 'return') { setSales((await api.sales('completed')).sales || []); setJournalOpen(true); }
    if (id === 'hold' && cart.length) { await api.holdSale({ items: cart.map((i) => ({ product_id: i.product_id, quantity: i.qty, price: i.price })) }); setCart([]); }
    if (id === 'held') { setHeld((await api.heldSales()).sales || []); }
    if (id === 'settings') setSettingsOpen(true);
    if (id === 'add-product') setProductAddOpen('');
    if (id === 'shifts') {
      setShifts((await api.shifts()).shifts || []);
      setShiftsOpen(true);
    }
    if (id === 'xz-report') {
      const r = await api.xzReport('X');
      setXzReport(r); setXzType('X'); setXzOpen(true);
    }
    if (id === 'old-version') setErr('Стара версія недоступна в StarNet Core');
    if (id === 'debt-return') { setDebtors((await api.debtors()).customers || []); setDebtOpen(true); }
    if (id === 'cancel' && cart.length) setCart([]);
  };

  const confirmCloseShift = async (closingCash) => {
    await api.closeShift(closingCash);
    const r = await api.xzReport('Z');
    setXzReport(r); setXzType('Z'); setXzOpen(true);
    setShift(null); setCloseShiftOpen(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3b5d] text-white">
            <div className="h-4 w-4 rounded-sm bg-white" />
          </div>
          <span className="text-2xl font-bold text-[#1a3b5d]">StarNet POS</span>
        </div>
        <form onSubmit={login} className="w-full max-w-md rounded-lg border border-ainur-border bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-center text-xl text-ainur-text">Авторизація</h2>
          {err && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input name="email" type="email" defaultValue="cashier@starnetcore.local" placeholder="Email або телефон"
              className="w-full rounded border border-ainur-border py-3 pl-10 pr-4 text-sm" />
          </div>
          <div className="relative mb-2">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input name="password" type="password" defaultValue="cashier123" placeholder="Пароль"
              className="w-full rounded border border-ainur-border py-3 pl-10 pr-4 text-sm" />
          </div>
          <p className="mb-6 text-right text-xs text-ainur-muted">Я забув пароль</p>
          <button type="submit" className="w-full rounded bg-ainur-green py-3 text-sm font-semibold lowercase text-white hover:opacity-90">увійти</button>
          <div className="mt-6 border-t border-ainur-border pt-4 text-center">
            <button type="button" className="inline-flex items-center gap-2 text-sm text-ainur-muted"><QrCode className="h-4 w-4" /> Увійти по QR-коду</button>
          </div>
        </form>
        <p className="mt-6 text-sm text-ainur-muted">У вас немає облікового запису? <span className="text-ainur-blue">Реєстрація</span></p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ainur-bg">
      {/* Шапка — біла, як AinurPOS */}
      <header className="flex shrink-0 items-center gap-2 border-b border-ainur-border bg-white px-3 py-2">
        <button type="button" onClick={() => setCategoryId('')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ainur-blue text-white">
          <FolderOpen className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук за найменуванням, артикулом, штрихкодом, кодом та описом"
            className="w-full rounded-lg border border-ainur-border bg-ainur-bg py-2.5 pl-4 pr-12 text-sm focus:border-ainur-blue focus:outline-none" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-ainur-border bg-white px-1.5 text-[10px] text-ainur-muted">F</span>
        </div>
        <button type="button" onClick={() => setBarcodeOpen(true)} className="hidden h-10 w-10 items-center justify-center rounded-lg border border-ainur-border text-ainur-blue hover:bg-blue-50 sm:flex">
          <ScanBarcode className="h-5 w-5" />
        </button>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
          <User className="h-4 w-4 text-ainur-muted" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ProductGrid categories={categories} categoryId={categoryId} setCategoryId={setCategoryId}
          products={catalog} cart={cart} onAdd={addToCart} onQty={setQty} />
        <CartPanel
          cart={cart} customer={customer}
          onChangeCustomer={() => setCustomerOpen(true)}
          onNewCustomer={() => { setCustomerOpen(true); setNewCustomerOpen(true); }}
          suggestions={suggestions} subtotal={subtotal} discountPct={custDiscPct} discountAmt={custDiscAmt} total={total}
          onRemove={(id) => setCart((c) => c.filter((x) => x.product_id !== id))}
          onEdit={setEditItem} onAddSuggestion={addToCart}
          onSale={openSale} onActions={cartAction} cartEmpty={!cart.length}
        />
      </div>

      <FooterBar storeName={settings.company_name || 'StarNet Core'} shift={shift} onMenu={() => setMenuOpen(true)}
        onXReport={async () => { const r = await api.xzReport('X'); setXzReport(r); setXzType('X'); setXzOpen(true); }} />

      {menuOpen && <SideMenu user={user} onClose={() => setMenuOpen(false)} onAction={menuAction} />}
      {payOpen && <PaymentScreen total={total} customer={customer} settings={settings} printDefault={settings.pos_print_default !== '0'}
        onClose={() => setPayOpen(false)} onPay={completePay} onChangeCustomer={() => setCustomerOpen(true)} />}
      {editItem && <ItemEditModal item={editItem} onClose={() => setEditItem(null)} onSave={(u) => { setCart((c) => c.map((x) => x.product_id === u.product_id ? u : x)); setEditItem(null); }} />}
      {customerOpen && <CustomerModal query={customerQ} setQuery={setCustomerQ} customers={customers} startNew={newCustomerOpen}
        onSearch={async () => setCustomers((await api.searchCustomers(customerQ)).customers || [])}
        onSelect={(c) => { setCustomer(c); setCustomerOpen(false); setNewCustomerOpen(false); }}
        onCreate={async (data) => { const c = await api.createCustomer(data); setCustomer(c); setCustomerOpen(false); setNewCustomerOpen(false); }}
        onClose={() => { setCustomerOpen(false); setNewCustomerOpen(false); }} />}
      {journalOpen && <ReceiptJournal sales={sales} onClose={() => setJournalOpen(false)} onReturn={async (id) => { await api.returnSale(id); setSales((await api.sales()).sales || []); }} />}
      {settingsOpen && <PosSettings settings={settings} onClose={() => setSettingsOpen(false)} onSave={async (s) => { const r = await api.updateSettings(s); setSettings(r.settings || s); setSettingsOpen(false); loadCatalog(); }} />}
      {barcodeOpen && <BarcodeModal onScan={scanBarcode} onClose={() => setBarcodeOpen(false)} />}
      {productAddOpen !== null && <ProductAddModal barcode={productAddOpen} categories={categories} onClose={() => setProductAddOpen(null)} onSave={createProduct} />}
      {lastSale && <ReceiptPrint sale={lastSale.sale} items={lastSale.items} settings={settings} customer={customer} cashier={user?.name} />}
      {commentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-3 font-semibold">Оскарження</h3>
            <textarea value={saleComment} onChange={(e) => setSaleComment(e.target.value)} rows={4} className="mb-4 w-full rounded-lg border border-ainur-border p-3 text-sm" />
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
      {err && <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm text-white" onClick={() => setErr('')}>{err}</div>}
      {shiftsOpen && <ShiftsModal shifts={shifts} onClose={() => setShiftsOpen(false)} onSelect={async (s) => {
        if (s.status === 'open') { const r = await api.xzReport('X'); setXzReport(r); setXzType('X'); setXzOpen(true); }
      }} />}
      {xzOpen && <XZReportModal report={xzReport} type={xzType} onClose={() => setXzOpen(false)}
        onSwitchType={async (t) => { const r = await api.xzReport(t); setXzReport(r); setXzType(t); }}
        onPrint={() => window.print()} />}
      {debtOpen && <DebtReturnModal customers={debtors} onSearch={async (q) => {
        const all = (await api.debtors()).customers || [];
        setDebtors(q ? all.filter((c) => c.name?.includes(q) || c.phone?.includes(q)) : all);
      }} onPay={(id, d) => api.debtPayment(id, d)} onClose={() => setDebtOpen(false)} />}
      {closeShiftOpen && <CloseShiftModal shift={shift} report={xzReport} onClose={() => setCloseShiftOpen(false)} onConfirm={confirmCloseShift} />}
      {registerSelectOpen && (
        <RegisterSelectModal
          registers={myRegisters.filter((r) => !r.open_shift)}
          onSelect={(r) => { setRegisterSelectOpen(false); setOpenShiftModal(r); }}
          onClose={() => setRegisterSelectOpen(false)}
        />
      )}
      {openShiftModal && (
        <OpenShiftModal register={openShiftModal} onClose={() => setOpenShiftModal(null)} onConfirm={confirmOpenShift} />
      )}
    </div>
  );
}
