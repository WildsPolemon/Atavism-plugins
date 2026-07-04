import { fmt } from '../utils';

export default function ReceiptJournal({ sales, onClose, onReturn }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-ainur-border px-6 py-4">
        <h2 className="text-xl font-semibold">Журнал чеків</h2>
        <button onClick={onClose} className="text-sm text-ainur-muted">Закрити [ESC]</button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-ainur-muted">
            <tr>
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">Дата</th>
              <th className="px-4 py-3 text-left">Касир</th>
              <th className="px-4 py-3 text-right">Сума</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-ainur-border hover:bg-gray-50">
                <td className="px-4 py-3">{s.id}</td>
                <td className="px-4 py-3">{s.created_at}</td>
                <td className="px-4 py-3">{s.cashier || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{fmt(s.total)}</td>
                <td className="px-4 py-3">
                  {s.status !== 'returned' && (
                    <button onClick={() => onReturn(s.id)} className="text-xs text-red-600 hover:underline">Повернення</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
