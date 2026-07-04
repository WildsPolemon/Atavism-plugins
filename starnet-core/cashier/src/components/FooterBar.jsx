import { Menu, Wifi, Cloud } from 'lucide-react';
import { nowUk } from '../utils';

export default function FooterBar({ storeName, shift, onMenu }) {
  return (
    <footer className="flex h-footer shrink-0 items-center justify-between border-t border-ainur-border bg-white px-4 text-sm">
      <button type="button" onClick={onMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium hover:bg-gray-100">
        <Menu className="h-5 w-5" /> Меню
      </button>

      <span className="hidden text-ainur-muted md:block">
        {storeName} / {shift ? `Зміна #${shift.id}` : 'Зміна не відкрита'}
      </span>

      <div className="flex items-center gap-3 text-ainur-muted">
        <span className="hidden text-xs sm:block">{nowUk()}</span>
        <Wifi className="h-4 w-4 text-green-500" />
        <Cloud className="h-4 w-4 text-ainur-blue" />
      </div>
    </footer>
  );
}
