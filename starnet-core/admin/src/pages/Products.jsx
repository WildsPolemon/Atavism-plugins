import { useEffect, useState, useMemo } from 'react';
import {
  Search, Plus, ScanBarcode, Loader2, Pencil, Trash2, FolderPlus, Tag, Filter,
  Package, Wrench, Layers, Download, Upload, Barcode,
} from 'lucide-react';
import { api, fmtUah, downloadExport } from '../api';

const COUNTRIES = ['Україна', 'Польща', 'Німеччина', 'Туреччина', 'Китай', 'США', 'Італія', 'Франція', 'Іспанія', 'Чехія'];
const UNITS = ['шт', 'кг', 'г', 'л', 'мл', 'уп', 'пак', 'м', 'м²', 'порція'];
const TAX_PRESETS = [
  { v: '0', l: 'Без податку' },
  { v: '20', l: 'ПДВ 20%' },
  { v: '7', l: 'ПДВ 7%' },
  { v: '5', l: 'ПДВ 5%' },
];

const emptyForm = () => ({
  type: 'product',
  name: '', barcode: '', sku: '', product_code: '', plu: '',
  category_ids: [], group_id: '', description: '', unit: 'шт',
  country: '', packaging_qty: '1', is_weighted: false,
  purchase_price: '', markup_percent: '', retail_price: '', sale_price: '',
  cost_price: '', free_price: false, discount_percent: '', tax_percent: '0',
  supplier_id: '', min_stock: '', expiry_date: '',
  enter_initial_stock: true, initial_stock: 0, warehouse_stocks: {},
  estore_visible: true, store_prices: {},
  has_modifications: false, mod_properties: [{ name: '', values: '' }],
  images: ['', '', '', ''],
  newCatInline: '',
});

export default function Products() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formTab, setFormTab] = useState('general');
  const [editId, setEditId] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [newCat, setNewCat] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [showCatPanel, setShowCatPanel] = useState(false);

  const tags = useMemo(() => categories.filter((c) => !c.is_group), [categories]);

  const loadCats = () => api.categories().then((r) => {
    setCategories(r.categories || []);
    setGroups(r.groups || (r.categories || []).filter((c) => c.is_group));
  });

  const load = () => api.products(1, search, {
    type: filterType,
    category_id: filterCat,
    group_id: filterGroup,
  }).then(setData);

  useEffect(() => {
    loadCats();
    api.suppliers().then((r) => setSuppliers(r.suppliers || []));
    api.warehouses().then((r) => setWarehouses(r.warehouses || []));
    api.stores().then((r) => setStores(r.stores || []));
  }, []);
  useEffect(() => { load(); }, [search, filterType, filterCat, filterGroup]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const calcRetail = (purchase, markup) => {
    const p = parseFloat(purchase) || 0;
    const m = parseFloat(markup) || 0;
    if (p > 0 && m > 0) return (p * (1 + m / 100)).toFixed(2);
    return form.retail_price;
  };

  async function onBarcodeChange(code) {
    set('barcode', code);
    if (code.length < 4) { setLookupMsg(''); return; }
    setLookupLoading(true);
    try {
      const r = await api.lookupBarcode(code);
      setForm((f) => ({
        ...f, barcode: code,
        name: r.name || f.name,
        images: [r.image_url || f.images[0], f.images[1], f.images[2], f.images[3]],
        retail_price: r.retail_price || f.retail_price,
      }));
      setLookupMsg(r.source === 'openfoodfacts' ? '✓ Open Food Facts' : r.source === 'local' ? '✓ В базі' : '');
    } catch { setLookupMsg('Не знайдено'); }
    finally { setLookupLoading(false); }
  }

  const openCreate = async (type = 'product') => {
    setEditId(null);
    let code = '';
    try { code = (await api.nextProductCode()).product_code; } catch { /* */ }
    setForm({ ...emptyForm(), type, product_code: code });
    setFormTab('general');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    const imgs = p.image_urls ? (typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : p.image_urls) : [];
    const allImgs = [p.image_url || imgs[0] || '', imgs[1] || '', imgs[2] || '', imgs[3] || ''];
    const mods = p.modifications ? (typeof p.modifications === 'string' ? JSON.parse(p.modifications) : p.modifications) : [];
    const storePrices = p.store_prices ? (typeof p.store_prices === 'string' ? JSON.parse(p.store_prices) : p.store_prices) : {};
    setForm({
      type: p.type || 'product',
      name: p.name, barcode: p.barcode || '', sku: p.sku || '', product_code: p.product_code || '',
      plu: p.plu || '', category_ids: (p.category_tags || []).map((t) => t.id),
      group_id: p.group_id || '', description: p.description || '', unit: p.unit || 'шт',
      country: p.country || '', packaging_qty: String(p.packaging_qty ?? 1),
      is_weighted: !!p.is_weighted,
      purchase_price: p.purchase_price ?? '', markup_percent: p.markup_percent ?? '',
      retail_price: p.retail_price ?? '', sale_price: p.sale_price ?? '',
      cost_price: p.cost_price ?? '', free_price: !!p.free_price,
      discount_percent: p.discount_percent ?? '', tax_percent: String(p.tax_percent ?? 0),
      supplier_id: p.supplier_id || '', min_stock: p.min_stock ?? '',
      expiry_date: p.expiry_date || '', enter_initial_stock: false, initial_stock: 0, warehouse_stocks: {},
      estore_visible: p.estore_visible !== 0,
      store_prices: storePrices || {},
      has_modifications: !!p.has_modifications,
      mod_properties: mods.length ? mods : [{ name: '', values: '' }],
      images: allImgs,
      newCatInline: '',
    });
    setFormTab('general');
    setShowForm(true);
  };

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id) ? f.category_ids.filter((x) => x !== id) : [...f.category_ids, id],
    }));
  };

  async function save(e) {
    e.preventDefault();
    const imgs = form.images.filter(Boolean);
    const payload = {
      ...form,
      group_id: form.group_id ? +form.group_id : null,
      supplier_id: form.supplier_id ? +form.supplier_id : null,
      purchase_price: +form.purchase_price || 0,
      markup_percent: +form.markup_percent || 0,
      retail_price: +form.retail_price || 0,
      sale_price: form.sale_price ? +form.sale_price : null,
      cost_price: +form.cost_price || +form.purchase_price || 0,
      discount_percent: +form.discount_percent || 0,
      tax_percent: +form.tax_percent || 0,
      min_stock: +form.min_stock || 0,
      packaging_qty: +form.packaging_qty || 1,
      is_weighted: form.is_weighted ? 1 : 0,
      free_price: form.free_price ? 1 : 0,
      estore_visible: form.estore_visible ? 1 : 0,
      has_modifications: form.has_modifications ? 1 : 0,
      image_url: imgs[0] || null,
      image_urls: imgs.slice(0, 4),
      modifications: form.has_modifications ? form.mod_properties.filter((m) => m.name) : [],
      store_prices: form.store_prices,
      initial_stock: form.enter_initial_stock ? (+form.initial_stock || 0) : 0,
      warehouse_stocks: form.enter_initial_stock ? form.warehouse_stocks : {},
    };
    delete payload.images;
    delete payload.newCatInline;
    delete payload.enter_initial_stock;
    delete payload.mod_properties;
    if (editId) await api.updateProduct(editId, payload);
    else await api.createProduct(payload);
    setShowForm(false);
    setForm(emptyForm());
    load();
  }

  const addCategory = async (isGroup = false) => {
    const name = (isGroup ? newGroup : newCat).trim();
    if (!name) return;
    await api.createCategory({ name, is_group: isGroup ? 1 : 0 });
    if (isGroup) setNewGroup(''); else setNewCat('');
    loadCats();
  };

  const removeCategory = async (id) => {
    if (!window.confirm('Видалити категорію?')) return;
    await api.deleteCategory(id);
    loadCats();
    load();
  };

  const genBarcode = async () => {
    const code = form.product_code || ('P' + Date.now().toString().slice(-6));
    if (!form.product_code) set('product_code', code);
    const barcode = '200' + String(Date.now()).slice(-10);
    set('barcode', barcode);
  };

  const addInlineCategory = async () => {
    const name = form.newCatInline.trim();
    if (!name) return;
    const r = await api.createCategory({ name, is_group: 0 });
    await loadCats();
    setForm((f) => ({ ...f, category_ids: [...f.category_ids, r.id], newCatInline: '' }));
  };

  const setImage = (i, v) => setForm((f) => {
    const images = [...f.images];
    images[i] = v;
    return { ...f, images };
  });

  const FORM_TABS = [
    { id: 'general', label: 'Загальне' },
    { id: 'prices', label: 'Ціни' },
    { id: 'warehouse', label: 'Склад' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ainur-text">Товари і послуги</h1>
          <p className="text-sm text-ainur-muted">Управління каталогом — як AinurPOS</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadExport(api.exportProducts, 'products.csv')}
            className="flex items-center gap-1 rounded-lg border border-ainur-border bg-white px-3 py-2 text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button type="button" onClick={() => setShowCatPanel(!showCatPanel)}
            className="flex items-center gap-1 rounded-lg border border-ainur-border bg-white px-3 py-2 text-sm hover:bg-gray-50">
            <Tag className="h-4 w-4" /> Категорії
          </button>
          <button type="button" onClick={() => openCreate('product')}
            className="flex items-center gap-2 rounded-lg bg-ainur-blue px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Створити товар
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ainur-muted" />
          <input placeholder="Пошук: назва, код, артикул, штрихкод..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ainur-border bg-white py-2 pl-10 pr-4 text-sm" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-ainur-border px-3 py-2 text-sm">
          <option value="">Усі типи</option>
          <option value="product">Товари</option>
          <option value="service">Послуги</option>
          <option value="kit">Комплекти</option>
        </select>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="rounded-lg border border-ainur-border px-3 py-2 text-sm">
          <option value="">Усі групи</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-ainur-border px-3 py-2 text-sm">
          <option value="">Усі категорії</option>
          {tags.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs text-ainur-muted">{data?.total ?? 0} поз.</span>
      </div>

      {/* Categories panel */}
      {showCatPanel && (
        <div className="glass mb-4 grid gap-4 p-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ainur-blue">
              <FolderPlus className="h-4 w-4" /> Групи (для каси)
            </h3>
            <div className="mb-2 flex flex-wrap gap-2">
              {groups.map((g) => (
                <span key={g.id} className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-ainur-blue">
                  {g.name}
                  <button type="button" onClick={() => removeCategory(g.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Нова група" className="flex-1 rounded-lg border border-ainur-border px-3 py-1.5 text-sm" />
              <button type="button" onClick={() => addCategory(true)} className="rounded-lg bg-ainur-blue px-3 py-1.5 text-xs font-medium text-white">Створити групу</button>
            </div>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ainur-orange">
              <Tag className="h-4 w-4" /> Категорії (мітки)
            </h3>
            <div className="mb-2 flex flex-wrap gap-2">
              {tags.map((c) => (
                <span key={c.id} className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs text-ainur-orange">
                  {c.name}
                  <button type="button" onClick={() => removeCategory(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Нова категорія" className="flex-1 rounded-lg border border-ainur-border px-3 py-1.5 text-sm" />
              <button type="button" onClick={() => addCategory(false)} className="rounded-lg bg-ainur-orange px-3 py-1.5 text-xs font-medium text-white">Створити категорію</button>
            </div>
          </div>
        </div>
      )}

      {/* Product table */}
      <div className="glass overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-ainur-bg text-xs text-ainur-muted">
            <tr>
              <th className="px-4 py-3">Фото</th>
              <th className="px-4 py-3">Найменування</th>
              <th className="px-4 py-3">Код</th>
              <th className="px-4 py-3">Штрихкод</th>
              <th className="px-4 py-3">Група</th>
              <th className="px-4 py-3">Категорії</th>
              <th className="px-4 py-3">Ціна</th>
              <th className="px-4 py-3">Залишок</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.products?.map((p) => (
              <tr key={p.id} className="border-t border-ainur-border hover:bg-gray-50">
                <td className="px-4 py-2">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded bg-ainur-bg text-ainur-muted"><Package className="h-4 w-4" /></div>}
                </td>
                <td className="px-4 py-2">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ainur-muted">{p.sku}{p.is_weighted ? ' · ваговий' : ''}</p>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{p.product_code || '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{p.barcode || '—'}</td>
                <td className="px-4 py-2 text-ainur-muted">{p.group_name || '—'}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(p.category_tags || []).map((t) => (
                      <span key={t.id} className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] text-ainur-orange">{t.name}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 font-medium text-ainur-blue">{fmtUah(p.sale_price || p.retail_price)}</td>
                <td className="px-4 py-2">{p.stock_qty ?? '—'}</td>
                <td className="px-4 py-2 text-xs capitalize">{typeLabel(p.type)}</td>
                <td className="px-4 py-2">
                  <button type="button" onClick={() => openEdit(p)} className="text-ainur-muted hover:text-ainur-blue"><Pencil className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4 pt-6">
          <form onSubmit={save} className="glass w-full max-w-4xl overflow-hidden">
            <div className="border-b border-ainur-border bg-white px-6 py-4">
              <h3 className="text-lg font-bold">{editId ? 'Редагувати' : 'Створити'} — {typeLabel(form.type)}</h3>
              {/* Type selector */}
              <div className="mt-3 flex gap-2">
                {[
                  { v: 'product', l: 'Товар', I: Package },
                  { v: 'service', l: 'Послуга', I: Wrench },
                  { v: 'kit', l: 'Комплект', I: Layers },
                ].map(({ v, l, I }) => (
                  <button key={v} type="button" onClick={() => set('type', v)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${form.type === v ? 'border-ainur-blue bg-blue-50 text-ainur-blue font-medium' : 'border-ainur-border'}`}>
                    <I className="h-4 w-4" />{l}
                  </button>
                ))}
              </div>
              {/* Tabs */}
              <div className="mt-4 flex gap-1 border-b border-ainur-border -mb-px">
                {FORM_TABS.map(({ id, label }) => (
                  <button key={id} type="button" onClick={() => setFormTab(id)}
                    className={`px-4 py-2 text-sm ${formTab === id ? 'border-b-2 border-ainur-blue text-ainur-blue font-medium' : 'text-ainur-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6">
              {formTab === 'general' && (
                <>
                  <h4 className="mb-4 text-sm font-semibold text-ainur-blue">Загальна інформація</h4>
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <Field label="Найменування *" className="col-span-2">
                      <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="inp" placeholder="Назва товару" />
                    </Field>
                    <Field label="Код товару">
                      <input value={form.product_code} readOnly={!editId} onChange={(e) => set('product_code', e.target.value)}
                        placeholder="Генерується автоматично" className="inp font-mono bg-ainur-bg" />
                      {!editId && <p className="mt-1 text-xs text-ainur-muted">Код призначається автоматично при збереженні</p>}
                    </Field>
                    <Field label="Артикул">
                      <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="inp" placeholder="SKU" />
                    </Field>
                    <Field label="PLU код">
                      <input value={form.plu} onChange={(e) => set('plu', e.target.value)} className="inp" placeholder="Для ваг / каси" />
                    </Field>
                    <Field label="Штрихкод">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input value={form.barcode} onChange={(e) => onBarcodeChange(e.target.value)} className="inp font-mono" placeholder="Скануйте або згенеруйте" />
                          {lookupLoading && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-ainur-blue" />}
                        </div>
                        <button type="button" onClick={genBarcode} className="shrink-0 rounded-lg border border-ainur-border px-3 py-2 text-xs hover:bg-gray-50">
                          <Barcode className="h-4 w-4 inline mr-1" />Згенерувати
                        </button>
                      </div>
                      {lookupMsg && <p className="mt-1 text-xs text-green-600">{lookupMsg}</p>}
                    </Field>
                  </div>

                  <Field label="Зображення (до 4)">
                    <div className="mb-3 grid grid-cols-4 gap-2">
                      {form.images.map((url, i) => (
                        <div key={i} className="text-center">
                          <div className="mb-1 flex h-20 items-center justify-center overflow-hidden rounded-lg border border-ainur-border bg-ainur-bg">
                            {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl text-ainur-muted">+</span>}
                          </div>
                          <input value={url} onChange={(e) => setImage(i, e.target.value)} placeholder={`Фото ${i + 1}`} className="inp text-xs" />
                        </div>
                      ))}
                    </div>
                  </Field>

                  <Field label="Категорії">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {tags.map((c) => (
                        <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                          className={`rounded-full px-3 py-1 text-xs ${form.category_ids.includes(c.id) ? 'bg-ainur-orange text-white' : 'bg-orange-50 text-ainur-orange border border-orange-200'}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={form.newCatInline} onChange={(e) => set('newCatInline', e.target.value)} placeholder="Нова категорія..." className="inp flex-1" />
                      <button type="button" onClick={addInlineCategory} className="rounded-lg bg-ainur-orange px-3 py-2 text-xs font-medium text-white">+ Додати</button>
                    </div>
                  </Field>

                  <div className="mb-4 mt-4 grid grid-cols-3 gap-3">
                    <Field label="Одиниця виміру">
                      <input list="units" value={form.unit} onChange={(e) => set('unit', e.target.value)} className="inp" />
                      <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                    </Field>
                    <Field label="Упаковка (к-сть в упаковці)">
                      <input type="number" step="0.001" value={form.packaging_qty} onChange={(e) => set('packaging_qty', e.target.value)} className="inp" />
                    </Field>
                    <Field label="Країна-виробник">
                      <select value={form.country} onChange={(e) => set('country', e.target.value)} className="inp">
                        <option value="">Оберіть країну</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>

                  <label className="mb-4 flex items-center gap-2 rounded-lg border border-ainur-border p-3 text-sm">
                    <input type="checkbox" checked={form.is_weighted} onChange={(e) => set('is_weighted', e.target.checked)} />
                    <span><strong>Ваговий товар</strong> — касир вводить кількість або зчитує з ваг</span>
                  </label>

                  <Field label="Опис (для інтернет-вітрини)">
                    <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="inp resize-none" placeholder="Опис товару..." />
                  </Field>
                </>
              )}

              {formTab === 'prices' && (
                <>
                  <h4 className="mb-4 text-sm font-semibold text-ainur-blue">Ціни</h4>
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <Field label="Ціна закупівлі">
                      <input type="number" step="0.01" value={form.purchase_price}
                        onChange={(e) => { set('purchase_price', e.target.value); set('retail_price', calcRetail(e.target.value, form.markup_percent)); }}
                        className="inp" placeholder="0.00" />
                    </Field>
                    <Field label="Націнка, %">
                      <input type="number" step="0.01" value={form.markup_percent}
                        onChange={(e) => { set('markup_percent', e.target.value); set('retail_price', calcRetail(form.purchase_price, e.target.value)); }}
                        className="inp" placeholder="%" />
                    </Field>
                    <Field label="Ціна продажу *">
                      <input required type="number" step="0.01" value={form.retail_price} onChange={(e) => set('retail_price', e.target.value)} className="inp font-semibold text-ainur-blue" />
                    </Field>
                    <Field label="Акційна ціна">
                      <input type="number" step="0.01" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} className="inp" />
                    </Field>
                    <Field label="Собівартість">
                      <input type="number" step="0.01" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} className="inp" />
                    </Field>
                    <Field label="Знижка, %">
                      <input type="number" step="0.01" value={form.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} className="inp" />
                    </Field>
                  </div>

                  <Field label="Податки">
                    <select value={form.tax_percent} onChange={(e) => set('tax_percent', e.target.value)} className="inp mb-4 max-w-xs">
                      {TAX_PRESETS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </Field>

                  <label className="mb-3 flex items-center gap-2 rounded-lg border border-ainur-border p-3 text-sm">
                    <input type="checkbox" checked={form.free_price} onChange={(e) => set('free_price', e.target.checked)} />
                    <span><strong>Товар за вільною ціною</strong> — касир може змінювати ціну на касі</span>
                  </label>

                  {stores.length > 0 && (
                    <>
                      <h4 className="mb-2 mt-4 text-sm font-semibold text-ainur-blue">Різні ціни в магазинах</h4>
                      <p className="mb-3 text-xs text-ainur-muted">Залиште порожнім — використовується базова ціна продажу</p>
                      {stores.map((st) => (
                        <div key={st.id} className="mb-2 flex items-center gap-3">
                          <span className="w-44 text-sm">{st.name}</span>
                          <input type="number" step="0.01" placeholder={form.retail_price || 'Базова ціна'}
                            value={form.store_prices[st.id] ?? ''}
                            onChange={(e) => set('store_prices', { ...form.store_prices, [st.id]: e.target.value })}
                            className="inp max-w-[140px]" />
                          <span className="text-xs text-ainur-muted">грн</span>
                        </div>
                      ))}
                    </>
                  )}

                  <label className="mt-4 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.estore_visible} onChange={(e) => set('estore_visible', e.target.checked)} />
                    Показувати на інтернет-вітрині
                  </label>
                </>
              )}

              {formTab === 'warehouse' && form.type !== 'service' && (
                <>
                  <h4 className="mb-4 text-sm font-semibold text-ainur-blue">Склад</h4>
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <Field label="Група">
                      <select value={form.group_id} onChange={(e) => set('group_id', e.target.value)} className="inp">
                        <option value="">— Оберіть групу —</option>
                        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Постачальник">
                      <select value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)} className="inp">
                        <option value="">— Оберіть постачальника —</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Мінімальний залишок">
                      <input type="number" step="0.001" value={form.min_stock} onChange={(e) => set('min_stock', e.target.value)} className="inp" placeholder="Сповіщення при нестачі" />
                    </Field>
                    <Field label="Термін придатності">
                      <input type="date" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} className="inp" />
                    </Field>
                  </div>

                  <label className="mb-4 flex items-center gap-2 rounded-lg border border-ainur-border p-3 text-sm">
                    <input type="checkbox" checked={form.has_modifications} onChange={(e) => set('has_modifications', e.target.checked)} />
                    <span><strong>Товар із модифікаціями</strong> (розмір, колір тощо)</span>
                  </label>

                  {form.has_modifications && (
                    <div className="mb-4 rounded-lg border border-ainur-border p-4">
                      <p className="mb-2 text-xs text-ainur-muted">Властивість та значення (через кому або Enter)</p>
                      {form.mod_properties.map((m, idx) => (
                        <div key={idx} className="mb-2 grid grid-cols-2 gap-2">
                          <input value={m.name} placeholder="Властивість (напр. Колір)"
                            onChange={(e) => {
                              const mod_properties = [...form.mod_properties];
                              mod_properties[idx] = { ...mod_properties[idx], name: e.target.value };
                              set('mod_properties', mod_properties);
                            }} className="inp" />
                          <input value={m.values} placeholder="Значення: S, M, L"
                            onChange={(e) => {
                              const mod_properties = [...form.mod_properties];
                              mod_properties[idx] = { ...mod_properties[idx], values: e.target.value };
                              set('mod_properties', mod_properties);
                            }} className="inp" />
                        </div>
                      ))}
                      <button type="button" onClick={() => set('mod_properties', [...form.mod_properties, { name: '', values: '' }])}
                        className="text-xs text-ainur-blue hover:underline">+ Додати властивість</button>
                    </div>
                  )}

                  <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={form.enter_initial_stock} onChange={(e) => set('enter_initial_stock', e.target.checked)} />
                    Ввести початкові залишки
                  </label>

                  {form.enter_initial_stock && (
                    <div className="mb-4 rounded-lg bg-ainur-bg p-4">
                      <p className="mb-2 text-xs text-ainur-muted">Вкажіть ціну закупівлі для коректної собівартості при оприбуткуванні</p>
                      {warehouses.length ? warehouses.map((w) => (
                        <div key={w.id} className="mb-2 flex items-center gap-3">
                          <span className="w-44 text-sm">{w.name}</span>
                          <input type="number" step="0.001" placeholder="0"
                            value={form.warehouse_stocks[w.id] ?? (warehouses.length === 1 ? form.initial_stock : '')}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (warehouses.length === 1) set('initial_stock', v);
                              set('warehouse_stocks', { ...form.warehouse_stocks, [w.id]: v });
                            }}
                            className="inp max-w-[140px]" />
                          <span className="text-xs text-ainur-muted">{form.unit}</span>
                        </div>
                      )) : (
                        <Field label="Початковий залишок">
                          <input type="number" step="0.001" value={form.initial_stock} onChange={(e) => set('initial_stock', e.target.value)} className="inp max-w-[140px]" />
                        </Field>
                      )}
                    </div>
                  )}
                </>
              )}

              {formTab === 'warehouse' && form.type === 'service' && (
                <p className="text-sm text-ainur-muted">Послуга не має фізичного залишку на складі.</p>
              )}
            </div>

            <div className="flex gap-3 border-t border-ainur-border bg-white p-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm">Скасувати</button>
              <button type="submit" className="flex-1 rounded-lg bg-ainur-orange py-2.5 text-sm font-bold text-white">
                {editId ? 'ЗБЕРЕГТИ' : 'СТВОРИТИ ТОВАР'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-ainur-muted">{label}</label>
      {children}
    </div>
  );
}

function typeLabel(t) {
  return ({ product: 'Товар', service: 'Послуга', kit: 'Комплект' })[t] || t;
}
