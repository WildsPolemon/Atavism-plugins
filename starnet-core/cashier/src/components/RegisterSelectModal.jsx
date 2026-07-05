import { fmt } from '../utils';

export default function RegisterSelectModal({ registers, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="border-b border-ainur-border px-5 py-4">
          <h2 className="text-lg font-semibold">Оберіть касу</h2>
          <p className="text-sm text-ainur-muted">Для відкриття зміни потрібно обрати касу</p>
        </div>
        <div className="max-h-[60vh] overflow-auto p-4">
          {!registers.length && (
            <p className="py-6 text-center text-sm text-ainur-muted">Немає доступних кас. Зверніться до адміністратора.</p>
          )}
          {registers.map((r) => (
            <button key={r.id} type="button" disabled={!!r.open_shift}
              onClick={() => onSelect(r)}
              className={`mb-2 flex w-full items-center justify-between rounded-lg border p-4 text-left ${r.open_shift ? 'cursor-not-allowed opacity-50' : 'border-ainur-border hover:bg-gray-50'}`}>
              <div>
                <p className="font-medium">{r.code || `N${r.id}`} · {r.name}</p>
                <p className="text-xs text-ainur-muted">{r.store_name} · {r.terminal_info || 'Каса'}</p>
                {r.open_shift && <p className="text-xs text-orange-600">Зайнята (зміна #{r.open_shift.id})</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-ainur-muted">Баланс</p>
                <p className="font-semibold text-ainur-blue">{fmt(r.balance)}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-ainur-border p-4">
          <button type="button" onClick={onClose} className="w-full rounded-lg border border-ainur-border py-2 text-sm">Скасувати</button>
        </div>
      </div>
    </div>
  );
}
