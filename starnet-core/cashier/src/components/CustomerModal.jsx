import { useState } from 'react';
import { UserPlus } from 'lucide-react';

export default function CustomerModal({ query, setQuery, customers, onSearch, onSelect, onCreate, onClose, startNew = false }) {
  const [newMode, setNewMode] = useState(startNew);
  const [form, setForm] = useState({ name: '', phone: '', email: '', discount_percent: 0 });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {!newMode ? (
          <>
            <div className="border-b border-ainur-border p-4">
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Пошук за ім'ям, телефоном, email, карткою"
                className="w-full rounded-lg border border-ainur-border px-4 py-3 text-sm focus:border-ainur-blue focus:outline-none" />
            </div>
            <div className="max-h-64 overflow-auto">
              {customers.map((c) => (
                <button key={c.id} type="button" onClick={() => onSelect(c)} className="flex w-full items-center gap-3 border-b border-ainur-border px-4 py-3 text-left hover:bg-gray-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ainur-orange text-sm font-bold text-white">{c.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-ainur-muted">{c.phone}{c.discount_percent > 0 ? ` · -${c.discount_percent}%` : ''}{c.debt > 0 ? ` · борг ${c.debt}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between p-4">
              <button type="button" onClick={() => setNewMode(true)} className="flex items-center gap-2 text-sm font-medium text-ainur-orange"><UserPlus className="h-4 w-4" /> Новий клієнт</button>
              <button type="button" onClick={onClose} className="text-sm font-medium text-ainur-muted">ЗАКРИТИ [ESC]</button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onCreate(form); }} className="p-4 space-y-3">
            <h3 className="font-semibold">Новий клієнт</h3>
            <input required placeholder="Ім'я *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
            <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-ainur-border px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setNewMode(false)} className="flex-1 rounded-lg border py-2 text-sm">Назад</button>
              <button type="submit" className="flex-1 rounded-lg bg-ainur-orange py-2 text-sm font-bold text-white">Створити</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
