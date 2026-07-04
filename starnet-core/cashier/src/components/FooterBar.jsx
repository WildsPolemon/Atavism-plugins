import { Menu, Wifi, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { fmt, nowUk } from '../utils';

export default function FooterBar({ storeName, shift, total, onMenu, onSale, onHold, onCancel, cartEmpty }) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <footer className="relative flex h-footer shrink-0 items-center justify-between border-t border-ainur-border bg-white px-4 text-sm">
      <button onClick={onMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 font-medium">
        <Menu className="h-5 w-5" /> Меню
      </button>
      <span className="text-ainur-muted hidden md:block">{storeName} / {shift ? `Зміна #${shift.id}` : 'Зміна не відкрита'}</span>
      <div className="flex items-center gap-4">
        <span className="text-xs text-ainur-muted hidden sm:block">{nowUk()}</span>
        <Wifi className="h-4 w-4 text-green-500" />
        <div className="relative">
          <button onClick={() => setActionsOpen(!actionsOpen)} className="rounded-lg p-2 hover:bg-gray-100"><MoreHorizontal className="h-5 w-5" /></button>
          {actionsOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-ainur-border bg-white py-1 shadow-lg">
              <button onClick={() => { onHold?.(); setActionsOpen(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Відкласти чек</button>
              <button onClick={() => { onCancel?.(); setActionsOpen(false); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">Скасувати чек</button>
            </div>
          )}
        </div>
        <button onClick={onSale} disabled={cartEmpty} className="rounded-lg bg-ainur-blue px-6 py-2 font-bold text-white disabled:opacity-40 hover:bg-ainur-blue-dark">
          ПРОДАЖ {fmt(total)}
        </button>
      </div>
    </footer>
  );
}
