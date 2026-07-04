import { Folder, Package } from 'lucide-react';
import { fmt } from '../utils';

const priceOf = (p) => Number(p.sale_price || p.retail_price || 0);

export default function ProductGrid({ categories, categoryId, setCategoryId, products, cart, onAdd, onQty }) {
  const folders = [{ id: '', name: 'Головна', count: products.length }, ...categories.map((c) => ({ id: String(c.id), name: c.name, count: '—' }))];

  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {folders.map((f) => (
          <button key={f.id || 'home'} onClick={() => setCategoryId(f.id)} className={`flex h-28 flex-col items-center justify-center rounded-lg border-2 bg-white p-3 transition ${categoryId === f.id ? 'border-ainur-orange' : 'border-ainur-border hover:border-ainur-blue'}`}>
            <Folder className={`h-10 w-10 mb-2 ${categoryId === f.id ? 'text-ainur-orange' : 'text-ainur-blue'}`} />
            <span className="text-sm font-medium text-center leading-tight">{f.name}</span>
            <span className="text-xs text-ainur-muted">{f.count} items</span>
          </button>
        ))}
        {products.map((p) => {
          const inCart = cart.find((x) => x.product_id === p.id);
          return (
            <div key={p.id} className="relative flex h-44 flex-col rounded-lg border border-ainur-border bg-white p-2 shadow-sm hover:shadow-md transition">
              <span className="text-[10px] text-ainur-muted">{p.stock_qty ?? 0} {p.unit || 'шт'}</span>
              <div className="flex flex-1 items-center justify-center my-1">
                {p.image_url ? <img src={p.image_url} alt="" className="max-h-16 max-w-full object-contain" /> : <Package className="h-12 w-12 text-gray-300" />}
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-tight min-h-[2rem]">{p.name}</p>
              <p className="text-[10px] text-ainur-muted truncate">{p.barcode || p.sku || ''}</p>
              <p className="mt-auto text-sm font-bold">{fmt(priceOf(p))}</p>
              {inCart ? (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-ainur-blue text-white text-xs">
                  <button onClick={() => onQty(p.id, inCart.qty - 1)} className="px-2 py-1">−</button>
                  <span className="min-w-[1rem] text-center">{inCart.qty}</span>
                  <button onClick={() => onQty(p.id, inCart.qty + 1)} className="px-2 py-1">+</button>
                </div>
              ) : (
                <button onClick={() => onAdd(p)} className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 bg-ainur-blue/10" aria-label="add" />
              )}
              {!inCart && <button onClick={() => onAdd(p)} className="absolute inset-0" aria-label="add" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
