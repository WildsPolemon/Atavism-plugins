import { X, Package } from 'lucide-react';
import { fmt } from '../utils';

export default function CartPanel({
  cart, customer, onChangeCustomer, suggestions, subtotal, discountPct, discountAmt, total,
  onRemove, onEdit, onAddSuggestion,
}) {
  return (
    <div className="flex w-cart shrink-0 flex-col border-l border-ainur-border bg-white">
      <div className="border-b border-ainur-border px-4 py-3">
        {customer ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ainur-orange text-sm font-bold text-white">
                {customer.name[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{customer.name}</p>
                <p className="truncate text-xs text-ainur-muted">{customer.phone || customer.email || ''}</p>
              </div>
            </div>
            <button type="button" onClick={onChangeCustomer} className="shrink-0 text-xs font-medium text-ainur-blue hover:underline">
              ЗМІНЮВАТИ
            </button>
          </div>
        ) : (
          <button type="button" onClick={onChangeCustomer} className="w-full rounded-lg border border-dashed border-ainur-border py-2 text-sm text-ainur-muted hover:border-ainur-blue hover:text-ainur-blue">
            + Обрати клієнта
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <p className="p-8 text-center text-sm text-ainur-muted">Виберіть товари</p>
        ) : (
          <div className="divide-y divide-ainur-border">
            {cart.map((i) => (
              <div key={i.product_id} className="group relative flex cursor-pointer gap-3 px-4 py-3 hover:bg-gray-50" onClick={() => onEdit(i)}>
                <Package className="mt-0.5 h-6 w-6 shrink-0 text-ainur-muted" />
                <div className="min-w-0 flex-1">
                  <p className="pr-6 text-sm font-semibold leading-tight">{i.name}</p>
                  <p className="text-xs text-ainur-muted">×{i.qty} · {fmt(i.price)}</p>
                </div>
                <p className="shrink-0 text-price-lg font-bold">{fmt(i.price * i.qty - (i.disc || 0))}</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i.product_id); }}
                  className="absolute right-2 top-2 text-gray-400 opacity-0 hover:text-red-500 group-hover:opacity-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && suggestions.length > 0 && (
          <div className="border-t border-ainur-border p-3">
            <p className="mb-2 text-xs font-medium text-ainur-muted">Купуєте разом</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const price = Number(s.sale_price || s.retail_price || 0);
                return (
                  <button key={s.id} type="button" onClick={() => onAddSuggestion?.(s)}
                    className="rounded-lg border border-ainur-border bg-white px-3 py-1.5 text-sm font-medium hover:border-ainur-blue hover:text-ainur-blue">
                    +{new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2 }).format(price)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-ainur-border p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-ainur-muted">Підсумок:</span>
          <span className="font-medium">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ainur-muted">Знижка {discountPct.toFixed(2)}%:</span>
          <span>{fmt(discountAmt)}</span>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold">
          <span>До сплати:</span>
          <span className="text-ainur-blue">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
