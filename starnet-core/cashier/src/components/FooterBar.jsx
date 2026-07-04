import { Menu, Wifi } from 'lucide-react';
import { fmt, nowUk } from '../utils';

export default function FooterBar({ storeName, shift, total, onMenu, onSale, cartEmpty }) {
  return (
    <footer className="flex h-footer shrink-0 items-center justify-between border-t border-ainur-border bg-white px-4 text-sm">
      <button onClick={onMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 font-medium">
        <Menu className="h-5 w-5" /> Меню
      </button>
      <span className="text-ainur-muted hidden md:block">{storeName} / {shift ? `Зміна #${shift.id}` : 'Зміна не відкрита'}</span>
      <div className="flex items-center gap-4">
        <span className="text-xs text-ainur-muted hidden sm:block">{nowUk()}</span>
        <Wifi className="h-4 w-4 text-green-500" />
        <button onClick={onSale} disabled={cartEmpty} className="rounded-lg bg-ainur-blue px-6 py-2 font-bold text-white disabled:opacity-40 hover:bg-ainur-blue-dark">
          ПРОДАЖ {fmt(total)}
        </button>
      </div>
    </footer>
  );
}
