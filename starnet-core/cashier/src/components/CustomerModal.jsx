import { UserPlus } from 'lucide-react';

export default function CustomerModal({ query, setQuery, customers, onSearch, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-ainur-border p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Пошук за ім'ям, телефоном, email, карткою"
            className="w-full rounded-lg border border-ainur-border px-4 py-3 text-sm focus:border-ainur-blue focus:outline-none"
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {customers.map((c) => (
            <button key={c.id} onClick={() => onSelect(c)} className="flex w-full items-center gap-3 border-b border-ainur-border px-4 py-3 text-left hover:bg-gray-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ainur-orange text-white text-sm font-bold">{c.name[0]}</div>
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-ainur-muted">{c.phone} {c.discount_percent > 0 && `· -${c.discount_percent}%`}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-between p-4">
          <button className="flex items-center gap-2 text-sm text-ainur-orange"><UserPlus className="h-4 w-4" /> Новий клієнт</button>
          <button onClick={onClose} className="text-sm text-ainur-muted">Закрити [ESC]</button>
        </div>
      </div>
    </div>
  );
}
