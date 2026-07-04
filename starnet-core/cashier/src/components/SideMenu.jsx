import { X, LogOut, RotateCcw, FileText, Clock, Settings } from 'lucide-react';

export default function SideMenu({ user, onClose, onAction }) {
  const items = [
    { id: 'logout', label: 'Вийти', icon: LogOut },
    { id: 'return', label: 'Створити повернення', icon: RotateCcw },
    { id: 'close-shift', label: 'Закрити зміну', icon: X, danger: true },
    { id: 'journal', label: 'Журнал чеків', icon: FileText },
    { id: 'shifts', label: 'Зміни', icon: Clock },
    { id: 'settings', label: 'Налаштування', icon: Settings },
    { id: 'hold', label: 'Відкласти чек', icon: FileText },
    { id: 'held', label: 'Відкладені чеки', icon: FileText },
    { id: 'xz', label: 'X-звіт', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex w-72 flex-col bg-white shadow-xl">
        <div className="border-b border-ainur-border p-4">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs text-ainur-muted">{user?.role === 'admin' ? 'Власник' : 'Касир'}</p>
        </div>
        <nav className="flex-1 overflow-auto py-2">
          {items.map(({ id, label, icon: Icon, danger }) => (
            <button key={id} onClick={() => { onAction(id); onClose(); }} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 ${danger ? 'text-red-600' : ''}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
