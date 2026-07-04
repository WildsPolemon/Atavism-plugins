import { Folder, Package, LayoutGrid } from 'lucide-react';
import { fmt } from '../utils';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

function PlaceholderImage() {
  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded bg-gray-100">
      <LayoutGrid className="h-8 w-8 text-gray-300" />
    </div>
  );
}

export default function ProductGrid({ categories, categoryId, setCategoryId, products, cart, onAdd, onQty }) {
  const folders = [
    { id: '', name: 'Головна', count: products.length },
    ...categories.map((c) => ({ id: String(c.id), name: c.name, count: null })),
  ];

  return (
    <div className="flex-1 overflow-auto bg-ainur-bg p-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {folders.map((f) => (
          <button
            key={f.id || 'home'}
            type="button"
            onClick={() => setCategoryId(f.id)}
            className={`flex h-product-card flex-col items-center justify-center rounded-lg border-2 bg-white p-3 text-center transition hover:shadow-md ${
              categoryId === f.id ? 'border-ainur-orange' : 'border-ainur-border'
            }`}
          >
            <span className="mb-1 text-[10px] text-ainur-muted">Група</span>
            <Folder className={`mb-2 h-10 w-10 ${categoryId === f.id ? 'text-ainur-orange' : 'text-gray-400'}`} />
            <p className="text-sm font-medium leading-tight">{f.name}</p>
            <p className="text-xs text-ainur-muted">{f.count != null ? `${f.count} поз.` : '—'}</p>
          </button>
        ))}

        {products.map((p) => {
          const inCart = cart.find((x) => x.product_id === p.id);
          return (
            <div
              key={p.id}
              className={`relative flex h-product-card flex-col rounded-lg border-2 bg-white p-3 transition hover:shadow-md ${
                inCart ? 'border-ainur-orange' : 'border-ainur-border'
              }`}
            >
              <span className="absolute right-2 top-2 text-[10px] text-ainur-muted">
                {p.stock_qty ?? 0} {p.unit || 'шт'}
              </span>
              <div className="mx-auto mt-3 flex flex-1 items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="max-h-[72px] max-w-full object-contain" />
                ) : (
                  <PlaceholderImage />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-tight">{p.name}</p>
              <p className="truncate text-[11px] text-ainur-muted">{p.barcode || p.sku || ''}</p>
              <p className="mt-auto text-price-lg font-bold">{fmt(priceOf(p))}</p>

              {inCart ? (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 rounded bg-white/95 py-1 shadow-sm">
                  <button type="button" onClick={() => onQty(p.id, inCart.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded border border-ainur-border text-ainur-blue">−</button>
                  <span className="min-w-[28px] text-center text-sm font-semibold">{inCart.qty}</span>
                  <button type="button" onClick={() => onQty(p.id, inCart.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded border border-ainur-border text-ainur-blue">+</button>
                </div>
              ) : (
                <button type="button" onClick={() => onAdd(p)} className="absolute inset-0 rounded-lg" aria-label={`Додати ${p.name}`} />
              )}
            </div>
          );
        })}
      </div>
      {!products.length && !folders.length && (
        <p className="py-16 text-center text-sm text-ainur-muted">Товарів не знайдено</p>
      )}
    </div>
  );
}
