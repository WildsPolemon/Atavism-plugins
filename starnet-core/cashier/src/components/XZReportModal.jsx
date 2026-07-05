import { X, Printer } from 'lucide-react';
import { fmt } from '../utils';

export default function XZReportModal({ report, type, onClose, onPrint, onSwitchType }) {
  const { shift, sales } = report || {};
  const expectedCash = (+shift?.opening_cash || 0) + (+sales?.cash || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ainur-border px-5 py-4">
          <h2 className="text-lg font-semibold">{type === 'Z' ? 'Z-звіт' : 'X-звіт'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-5 text-sm">
          <div className="flex justify-between"><span className="text-ainur-muted">Зміна</span><span>#{shift?.id}</span></div>
          <div className="flex justify-between"><span className="text-ainur-muted">Відкрита</span><span>{shift?.opened_at}</span></div>
          <div className="flex justify-between"><span className="text-ainur-muted">Касир</span><span>{shift?.cashier || '—'}</span></div>
          <hr className="border-ainur-border" />
          <div className="flex justify-between"><span>Чеків</span><span>{sales?.count ?? 0}</span></div>
          <div className="flex justify-between"><span>Готівка</span><span>{fmt(sales?.cash)}</span></div>
          <div className="flex justify-between"><span>Картка</span><span>{fmt(sales?.card)}</span></div>
          <div className="flex justify-between"><span>Відстрочка</span><span>{fmt(sales?.deferred)}</span></div>
          <div className="flex justify-between font-semibold"><span>Разом</span><span>{fmt(sales?.total)}</span></div>
          <hr className="border-ainur-border" />
          <div className="flex justify-between"><span className="text-ainur-muted">Початкова готівка</span><span>{fmt(shift?.opening_cash)}</span></div>
          <div className="flex justify-between font-medium"><span>Очікувана в касі</span><span>{fmt(expectedCash)}</span></div>
        </div>
        <div className="flex gap-2 border-t border-ainur-border p-4">
          <button type="button" onClick={() => onSwitchType(type === 'X' ? 'Z' : 'X')}
            className="flex-1 rounded-lg border border-ainur-border py-2.5 text-sm hover:bg-gray-50">
            {type === 'X' ? 'Z-звіт' : 'X-звіт'}
          </button>
          <button type="button" onClick={onPrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ainur-blue py-2.5 text-sm text-white">
            <Printer className="h-4 w-4" /> Друк
          </button>
        </div>
      </div>
    </div>
  );
}
