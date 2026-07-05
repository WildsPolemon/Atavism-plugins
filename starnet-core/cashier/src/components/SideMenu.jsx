import { LogOut, RotateCcw, X, FileText, Clock, Settings, RefreshCw, Wallet, BarChart3 } from 'lucide-react';

export default function SideMenu({ user, onClose, onAction }) {
  const items = [
    { id: 'logout', label: 'Вийти', icon: LogOut },
    { id: 'old-version', label: 'Повернутися до старої версії', icon: RefreshCw },
    { id: 'return', label: 'Створити повернення', icon: RotateCcw },
    { id: 'close-shift', label: 'Закрити зміну', icon: X, danger: true },
    { id: 'debt-return', label: 'Повернення боргу', icon: Wallet },
    { id: 'journal', label: 'Журнал чеків', icon: FileText },
    { id: 'shifts', label: 'Зміни', icon: Clock },
    { id: 'xz-report', label: 'X-звіт', icon: BarChart3 },
    { id: 'settings', label: 'Налаштування', icon: Settings },
    { id: 'add-product', label: 'Додати товар', icon: FileText },
    { id: 'held', label: 'Відкладені чеки', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative mt-auto flex w-80 max-h-[70vh] flex-col rounded-tr-xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-ainur-border p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ainur-orange text-lg font-bold text-white">
            {(user?.name || 'K')[0]}
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-ainur-muted">{user?.role === 'admin' ? 'Власник' : 'Касир'}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-auto py-1">
          {items.map(({ id, label, icon: Icon, danger }) => (
            <button key={id} type="button" onClick={() => { onAction(id); onClose(); }}
              className={`flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm hover:bg-gray-50 ${danger ? 'text-red-600' : 'text-ainur-text'}`}>
              <Icon className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
