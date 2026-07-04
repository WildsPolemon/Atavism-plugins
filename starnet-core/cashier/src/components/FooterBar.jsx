import { Menu, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { fmt, nowUk } from '../utils';

export default function FooterBar({ storeName, shift, total, userName, onMenu, onSale, onHold, onCancel, onComment, cartEmpty }) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <footer className="relative flex h-footer shrink-0 items-center justify-between border-t border-ainur-border bg-white px-4">
      <button type="button" onClick={onMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
        <Menu className="h-5 w-5" /> Меню
      </button>

      <div className="hidden flex-col items-center text-center md:flex">
        <span className="text-sm text-ainur-text">{storeName} / {shift ? `Зміна #${shift.id}` : 'Зміна не відкрита'}</span>
        <span className="text-xs text-ainur-muted">{nowUk()}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button type="button" onClick={() => setActionsOpen(!actionsOpen)} className="rounded-lg p-2 hover:bg-gray-100">
            <MoreHorizontal className="h-5 w-5 text-ainur-muted" />
          </button>
          {actionsOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 rounded-lg border border-ainur-border bg-white py-1 shadow-lg">
              {userName && <p className="border-b border-ainur-border px-4 py-2 text-sm font-medium">{userName}</p>}
              <button type="button" onClick={() => { onHold?.(); setActionsOpen(false); }} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50">Відкласти чек</button>
              <button type="button" onClick={() => { onCancel?.(); setActionsOpen(false); }} className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-gray-50">Скасувати чек</button>
              <button type="button" onClick={() => { onComment?.(); setActionsOpen(false); }} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50">Оскарження</button>
            </div>
          )}
        </div>
        <button type="button" onClick={onSale} disabled={cartEmpty}
          className="flex h-sale-btn min-w-[180px] items-center justify-center gap-2 rounded-lg bg-ainur-blue px-6 text-base font-semibold text-white shadow-sm disabled:opacity-40 hover:bg-ainur-blue-dark">
          ПРОДАЖ {fmt(total)}
        </button>
      </div>
    </footer>
  );
}
