import { Menu, Wifi, Cloud, FileBarChart } from 'lucide-react';
import { nowUk } from '../utils';

export default function FooterBar({ storeName, shift, user, onMenu, onXReport }) {
  return (
    <footer className="flex h-footer shrink-0 items-center justify-between border-t border-ainur-border bg-white px-4 text-sm">
      <button type="button" onClick={onMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium hover:bg-gray-100">
        <Menu className="h-5 w-5" /> Меню
      </button>

      <span className="hidden text-ainur-muted md:block">
        {storeName} / {shift ? `Зміна #${shift.id}` : 'Зміна не відкрита'}
        {user?.name && <span className="text-ainur-text"> · {user.name}</span>}
      </span>

      <div className="flex items-center gap-3 text-ainur-muted">
        {shift && onXReport && (
          <button type="button" onClick={onXReport} className="hidden items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-gray-100 sm:flex">
            <FileBarChart className="h-4 w-4" /> X-звіт
          </button>
        )}
        <span className="hidden text-xs sm:block">{nowUk()}</span>
        <Wifi className="h-4 w-4 text-green-500" />
        <Cloud className="h-4 w-4 text-ainur-blue" />
      </div>
    </footer>
  );
}
