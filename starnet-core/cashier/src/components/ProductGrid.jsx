import { Package } from 'lucide-react';
import { fmt } from '../utils';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

export default function ProductGrid({ products, cart, onAdd, onQty }) {
  return (
    <div className="flex-1 overflow-auto bg-ainur-bg p-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {products.map((p) => {
          const inCart = cart.find((x) => x.product_id === p.id);
          return (
            <div
              key={p.id}
              className="relative flex h-product-card w-product-card flex-col rounded-lg border border-ainur-border bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              <span className="absolute left-2 top-2 rounded bg-ainur-bg px-1.5 py-0.5 text-[10px] text-ainur-muted">
                {p.stock_qty ?? 0} {p.unit || 'шт'}
              </span>
              <div className="mx-auto mt-4 flex h-[120px] w-[120px] items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <Package className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-tight text-ainur-text">{p.name}</p>
              <p className="truncate text-xs text-ainur-muted">{p.barcode || p.sku || ''}</p>
              <p className="mt-auto text-price-lg font-bold text-ainur-text">{fmt(priceOf(p))}</p>

              {inCart ? (
                <div className="absolute bottom-3 right-3 flex items-center rounded-md bg-ainur-blue text-white">
                  <button type="button" onClick={() => onQty(p.id, inCart.qty - 1)} className="flex h-7 w-7 items-center justify-center text-lg leading-none">−</button>
                  <span className="min-w-[40px] text-center text-sm font-semibold">{inCart.qty}</span>
                  <button type="button" onClick={() => onQty(p.id, inCart.qty + 1)} className="flex h-7 w-7 items-center justify-center text-lg leading-none">+</button>
                </div>
              ) : (
                <button type="button" onClick={() => onAdd(p)} className="absolute inset-0 rounded-lg" aria-label={`Додати ${p.name}`} />
              )}
            </div>
          );
        })}
      </div>
      {!products.length && (
        <p className="py-16 text-center text-sm text-ainur-muted">Товарів не знайдено</p>
      )}
    </div>
  );
}
