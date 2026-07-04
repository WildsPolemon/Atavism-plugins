import { X, MoreHorizontal } from 'lucide-react';
import { fmt } from '../utils';

export default function CartPanel({ cart, suggestions, subtotal, discountPct, discountAmt, total, onRemove, onEdit, onSale, onAddSuggestion }) {
  return (
    <div className="flex w-cart shrink-0 flex-col border-l border-ainur-border bg-white">
      <div className="flex items-center justify-between border-b border-ainur-border px-4 py-3">
        <span className="text-sm font-medium text-ainur-muted">Рекомендація</span>
        <button className="text-ainur-muted">⚙</button>
      </div>

      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <p className="p-8 text-center text-sm text-ainur-muted">Виберіть товари</p>
        ) : (
          <div className="divide-y divide-ainur-border">
            {cart.map((i) => (
              <div key={i.product_id} className="group relative px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(i)}>
                <button onClick={(e) => { e.stopPropagation(); onRemove(i.product_id); }} className="absolute right-2 top-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><X className="h-4 w-4" /></button>
                <p className="pr-6 text-sm font-medium leading-tight">{i.name}</p>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-ainur-muted">×{i.qty} · {fmt(i.price)}</span>
                  <span className="font-semibold">{fmt(i.price * i.qty - (i.disc || 0))}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && suggestions.length > 0 && (
          <div className="border-t border-ainur-border p-3">
            <p className="mb-2 text-xs font-medium text-ainur-muted">Купують разом</p>
            <div className="flex gap-2 overflow-x-auto">
              {suggestions.map((s) => (
                <button key={s.id} type="button" onClick={() => onAddSuggestion?.(s)} className="shrink-0 w-28 rounded border border-ainur-border p-2 text-center hover:border-ainur-blue">
                  <p className="text-[10px] line-clamp-2 h-8">{s.name}</p>
                  <p className="text-xs font-bold mt-1">{fmt(s.sale_price || s.retail_price)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-ainur-border p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-ainur-muted">Підсумок</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-ainur-muted">Знижка {discountPct}%</span><span>{fmt(discountAmt)}</span></div>
      </div>

      <div className="border-t border-ainur-border p-3">
        <button onClick={onSale} disabled={!cart.length} className="flex w-full items-center justify-between rounded-lg bg-ainur-blue px-4 py-3.5 text-white font-bold disabled:opacity-40 hover:bg-ainur-blue-dark">
          <span className="flex items-center gap-2"><MoreHorizontal className="h-5 w-5" /> ПРОДАЖ</span>
          <span>{fmt(total)}</span>
        </button>
      </div>
    </div>
  );
}
