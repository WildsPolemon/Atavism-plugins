import { useSearchParams } from 'react-router-dom';
import Warehouse from './Warehouse';
import Purchases from './Purchases';
import Inventory from './Inventory';
import PriceTags from './PriceTags';

const TABS = [
  { id: 'stock', label: 'Залишки та операції', comp: Warehouse },
  { id: 'purchases', label: 'Закупівлі', comp: Purchases },
  { id: 'inventory', label: 'Інвентаризація', comp: Inventory },
  { id: 'tags', label: 'Цінники', comp: PriceTags },
];

export default function StockHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'stock';
  const active = TABS.find((t) => t.id === tab) || TABS[0];
  const Comp = active.comp;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Рух товару</h1>
      <p className="mb-4 text-sm text-ainur-muted">Склад, закупівлі, інвентаризація, цінники</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setParams({ tab: t.id })}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t.id ? 'bg-ainur-blue text-white' : 'bg-white border border-ainur-border text-ainur-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <Comp embedded />
    </div>
  );
}
