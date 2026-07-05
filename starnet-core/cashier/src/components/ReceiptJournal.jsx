import { useState } from 'react';
import { ChevronDown, ChevronUp, Printer, Search } from 'lucide-react';
import { fmt } from '../utils';

export default function ReceiptJournal({ sales, onClose, onReturn, onPrint, onFilter, returnMode: returnModeProp }) {
  const [expanded, setExpanded] = useState(null);
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [returnMode, setReturnMode] = useState(returnModeProp || false);
  const [partial, setPartial] = useState({});

  const applyFilter = () => onFilter?.({ date, search });

  const togglePartial = (saleId, productId, maxQty) => {
    setPartial((p) => {
      const key = `${saleId}-${productId}`;
      const cur = p[key] ?? 0;
      const next = cur >= maxQty ? 0 : maxQty;
      return { ...p, [key]: next };
    });
  };

  const doReturn = async (sale) => {
    const items = (sale.items || []).map((it) => {
      const key = `${sale.id}-${it.product_id}`;
      const q = partial[key];
      return q > 0 ? { product_id: it.product_id, quantity: q } : null;
    }).filter(Boolean);
    await onReturn(sale.id, items.length ? items : null);
    setReturnMode(false);
    setPartial({});
  };

  const statusLabel = (s) => ({
    completed: 'Оплачений',
    returned: 'Повернений',
    held: 'Відкладений',
  }[s] || s);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ainur-border px-6 py-4">
        <h2 className="text-xl font-semibold">{returnMode ? 'Створити повернення' : 'Журнал чеків'}</h2>
        <button type="button" onClick={onClose} className="text-sm text-ainur-muted">ЗАКРИТИ <span className="text-xs">[ESC]</span></button>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-b border-ainur-border bg-gray-50 px-6 py-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-ainur-muted">ВИБЕРІТЬ ДАТУ</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-ainur-border px-3 py-2 text-sm" />
        </label>
        <label className="flex-1 text-sm min-w-[200px]">
          <span className="mb-1 block text-xs text-ainur-muted">Номер / клієнт / товар</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук..."
              className="w-full rounded-lg border border-ainur-border py-2 pl-9 pr-3 text-sm" />
          </div>
        </label>
        <button type="button" onClick={applyFilter} className="rounded-lg bg-ainur-blue px-4 py-2 text-sm text-white">Знайти</button>
        {!returnMode && (
          <button type="button" onClick={() => setReturnMode(true)} className="rounded-lg border border-ainur-border px-4 py-2 text-sm text-red-600">Повернення</button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {sales.map((s) => (
          <div key={s.id} className="mb-3 rounded-lg border border-ainur-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex-1 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Продаж #{s.id}</p>
                  <span className={`rounded px-2 py-0.5 text-xs ${s.status === 'completed' ? 'bg-green-100 text-green-700' : s.status === 'returned' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                    {statusLabel(s.status)}
                  </span>
                  {expanded === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <p className="text-sm text-ainur-muted">{s.created_at} · {s.cashier} · {s.store_name || 'Магазин'}</p>
                <p className="text-sm">{s.customer_name ? `Клієнт: ${s.customer_name}` : 'Без клієнта'} · {s.items_count ?? s.items?.length ?? 0} поз.</p>
              </div>
              <p className="text-lg font-bold">{fmt(s.total)}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => onPrint?.(s)} className="flex items-center gap-1 rounded border border-ainur-border px-3 py-1.5 text-xs hover:bg-gray-50">
                  <Printer className="h-3 w-3" /> ДРУК
                </button>
                {s.status === 'completed' && returnMode && (
                  <button type="button" onClick={() => doReturn(s)} className="rounded bg-red-600 px-3 py-1.5 text-xs text-white">ПОВЕРНЕННЯ</button>
                )}
                {s.status === 'completed' && !returnMode && (
                  <button type="button" onClick={() => onReturn(s.id, null)} className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600">ПОВЕРНЕННЯ</button>
                )}
              </div>
            </div>
            {expanded === s.id && (
              <div className="border-t border-ainur-border bg-gray-50 px-4 py-3 text-sm">
                <p className="mb-2 font-medium">Список товарів</p>
                {(s.items || []).map((it) => (
                  <div key={it.id} className="flex items-center justify-between border-b border-ainur-border/50 py-2 last:border-0">
                    <span>{it.name} × {it.quantity}</span>
                    <div className="flex items-center gap-3">
                      <span>{fmt(it.total)}</span>
                      {returnMode && s.status === 'completed' && (
                        <button type="button" onClick={() => togglePartial(s.id, it.product_id, +it.quantity)}
                          className={`rounded px-2 py-0.5 text-xs ${partial[`${s.id}-${it.product_id}`] ? 'bg-red-600 text-white' : 'border border-ainur-border'}`}>
                          {partial[`${s.id}-${it.product_id}`] ? `−${partial[`${s.id}-${it.product_id}`]}` : 'Обрати'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!sales.length && <p className="py-16 text-center text-ainur-muted">Чеків не знайдено</p>}
      </div>
    </div>
  );
}
