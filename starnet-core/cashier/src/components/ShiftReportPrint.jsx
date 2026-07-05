import { fmt } from '../utils';

export default function ShiftReportPrint({ report, settings, cashier, type = 'X' }) {
  if (!report) return null;
  const { shift, sales, movements } = report;
  const title = type === 'Z' ? 'Z-ЗВІТ (закриття зміни)' : 'X-ЗВІТ';

  return (
    <div id="shift-report-print" className="hidden print:block fixed inset-0 bg-white p-4 text-black text-xs font-mono">
      <div className="mx-auto max-w-[80mm]">
        <p className="text-center font-bold text-sm">{settings?.company_name || 'StarNet Core'}</p>
        <p className="text-center font-bold">{title}</p>
        <p className="text-center text-[10px]">Зміна #{shift?.id} · {cashier || '—'}</p>
        <p className="text-center text-[10px]">{shift?.opened_at} — {shift?.closed_at || 'відкрита'}</p>
        <hr className="my-2 border-dashed border-gray-400" />
        <p className="flex justify-between"><span>Чеків</span><span>{sales?.count || 0}</span></p>
        <p className="flex justify-between"><span>Оборот</span><span>{fmt(sales?.total)}</span></p>
        <p className="flex justify-between"><span>Готівка (продажі)</span><span>{fmt(sales?.cash)}</span></p>
        <p className="flex justify-between"><span>Картка</span><span>{fmt(sales?.card)}</span></p>
        <p className="flex justify-between"><span>Відстрочення</span><span>{fmt(sales?.deferred)}</span></p>
        <hr className="my-2 border-dashed border-gray-400" />
        <p className="flex justify-between"><span>Початкова готівка</span><span>{fmt(shift?.opening_cash)}</span></p>
        <p className="flex justify-between"><span>Внесення</span><span>{fmt(shift?.cash_in_total)}</span></p>
        <p className="flex justify-between"><span>Вилучення</span><span>{fmt(shift?.cash_out_total)}</span></p>
        <p className="flex justify-between font-bold"><span>Очікувана в касі</span><span>{fmt(shift?.expected_cash)}</span></p>
        {type === 'Z' && (
          <>
            <p className="flex justify-between"><span>Розмінна (залишок)</span><span>{fmt(shift?.closing_cash)}</span></p>
            <p className="flex justify-between font-bold"><span>Різниця перерахунку</span><span>{fmt(shift?.variance)}</span></p>
          </>
        )}
        {(movements || []).length > 0 && (
          <>
            <hr className="my-2 border-dashed border-gray-400" />
            <p className="font-bold mb-1">Рух готівки:</p>
            {movements.map((m) => (
              <p key={m.id} className="text-[10px]">
                {m.type === 'in' ? '+' : '−'}{fmt(m.amount)} {m.note || ''}
              </p>
            ))}
          </>
        )}
        <hr className="my-2 border-dashed border-gray-400" />
        <p className="text-center text-[10px]">{settings?.receipt_footer || ''}</p>
      </div>
    </div>
  );
}
