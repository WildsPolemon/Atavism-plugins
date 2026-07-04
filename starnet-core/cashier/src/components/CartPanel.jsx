import { useState } from 'react';
import { X, Package, Search, UserPlus, MoreVertical, Settings } from 'lucide-react';
import { fmt, fmtCompact } from '../utils';

export default function CartPanel({
  cart, customer, onChangeCustomer, onNewCustomer, suggestions, subtotal, discountPct, discountAmt, total,
  onRemove, onEdit, onAddSuggestion, onSale, onActions, cartEmpty,
}) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className="flex w-cart shrink-0 flex-col border-l border-ainur-border bg-white">
      {/* Клієнт — як AinurPOS */}
      <div className="flex items-center gap-2 border-b border-ainur-border px-3 py-2">
        <div className="relative flex flex-1 items-center">
          <Search className="absolute left-3 h-4 w-4 text-ainur-muted" />
          <button type="button" onClick={onChangeCustomer} className="w-full rounded-lg border border-ainur-border bg-ainur-bg py-2 pl-9 pr-3 text-left text-sm text-ainur-muted">
            {customer?.name || 'Клієнт'}
          </button>
        </div>
        <button type="button" onClick={onChangeCustomer} className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-ainur-border text-xs text-ainur-muted">C</button>
        <button type="button" onClick={onNewCustomer} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ainur-orange text-white">
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      {/* Рекомендація */}
      <div className="flex items-center justify-between border-b border-ainur-border px-4 py-2">
        <span className="text-sm text-ainur-muted">Рекомендація</span>
        <button type="button" className="text-ainur-muted hover:text-ainur-blue"><Settings className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <p className="p-8 text-center text-sm text-ainur-muted">Виберіть товари</p>
        ) : (
          <div className="divide-y divide-ainur-border">
            {cart.map((i) => (
              <div key={i.product_id} className="group relative cursor-pointer px-4 py-3 hover:bg-gray-50" onClick={() => onEdit(i)}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i.product_id); }}
                  className="absolute right-3 top-3 text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
                <p className="pr-8 text-sm font-medium leading-tight">{i.name}</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm text-ainur-muted">{fmt(i.price)}</span>
                  <span className="text-xs text-ainur-muted">× {i.qty}</span>
                  <span className="text-sm font-semibold">{fmt(i.price * i.qty - (i.disc || 0))}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && suggestions.length > 0 && (
          <div className="border-t border-ainur-border p-3">
            <p className="mb-2 text-xs font-medium text-ainur-muted">Купують разом</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s) => {
                const price = Number(s.sale_price || s.retail_price || 0);
                return (
                  <button key={s.id} type="button" onClick={() => onAddSuggestion?.(s)}
                    className="rounded-lg border border-ainur-border p-2 text-left hover:border-ainur-blue">
                    <div className="mb-1 flex h-10 items-center justify-center rounded bg-gray-50">
                      {s.image_url ? <img src={s.image_url} alt="" className="max-h-full max-w-full object-contain" /> : <Package className="h-5 w-5 text-gray-300" />}
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-tight">{s.name}</p>
                    <p className="mt-1 text-xs font-bold text-ainur-blue">+ {fmtCompact(price)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-ainur-border px-4 py-3 text-sm">
        <div className="flex justify-between"><span className="text-ainur-muted">Підсумок:</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-ainur-muted">Знижка {discountPct.toFixed(2)}%:</span><span>{fmt(discountAmt)}</span></div>
      </div>

      <div className="relative border-t border-ainur-border p-3">
        <div className={`flex h-sale-btn w-full items-center overflow-hidden rounded-lg bg-ainur-blue text-white ${cartEmpty ? 'opacity-40' : ''}`}>
          <button type="button" onClick={() => setActionsOpen(!actionsOpen)} disabled={cartEmpty}
            className="flex h-full w-12 shrink-0 items-center justify-center border-r border-white/20 hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </button>
          <button type="button" onClick={onSale} disabled={cartEmpty} className="flex flex-1 items-center justify-between px-4 hover:bg-white/5 disabled:cursor-not-allowed">
            <span className="text-base font-semibold">ПРОДАЖ</span>
            <span className="text-base font-semibold">{fmtCompact(total)}</span>
          </button>
        </div>
        {actionsOpen && (
          <div className="absolute bottom-full left-3 mb-2 w-48 rounded-lg border border-ainur-border bg-white py-1 shadow-lg">
            <button type="button" onClick={() => { onActions?.('hold'); setActionsOpen(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Відкласти чек</button>
            <button type="button" onClick={() => { onActions?.('cancel'); setActionsOpen(false); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">Скасувати чек</button>
            <button type="button" onClick={() => { onActions?.('comment'); setActionsOpen(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Оскарження</button>
          </div>
        )}
      </div>
    </div>
  );
}
