import { useSearchParams } from 'react-router-dom';
import Suppliers from './Suppliers';
import CRM from './CRM';
import Stores from './Stores';

const TABS = [
  { id: 'suppliers', label: 'Постачальники', comp: Suppliers },
  { id: 'customers', label: 'Клієнти', comp: CRM },
  { id: 'stores', label: 'Магазини', comp: Stores },
];

export default function Counterparties() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'suppliers';
  const active = TABS.find((t) => t.id === tab) || TABS[0];
  const Comp = active.comp;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Контрагенти</h1>
      <p className="mb-4 text-sm text-ainur-muted">Постачальники, клієнти, магазини</p>
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
