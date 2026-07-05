import { fmt } from '../utils';

export default function ReceiptPrint({ sale, items, settings, customer, cashier }) {
  if (!sale) return null;
  const cash = Number(sale.payment_cash || 0);
  const card = Number(sale.payment_card || 0);
  const deferred = Number(sale.payment_deferred || 0);
  const change = Math.max(0, cash + card + deferred - Number(sale.total || 0));

  return (
    <div id="receipt-print" className="hidden print:block fixed inset-0 bg-white p-4 text-black text-xs font-mono">
      <div className="mx-auto max-w-[80mm]">
        <p className="text-center font-bold text-sm">{settings.company_name || 'StarNet Core'}</p>
        {settings.receipt_address && <p className="text-center">{settings.receipt_address}</p>}
        <p className="text-center text-[10px] mt-1">Чек №{sale.id}</p>
        <p className="text-center text-[10px]">{sale.created_at || new Date().toLocaleString('uk-UA')}</p>
        <p className="text-center text-[10px]">Касир: {cashier || '—'}</p>
        {customer && <p className="text-center text-[10px]">Клієнт: {customer.name}</p>}
        <hr className="my-2 border-dashed border-gray-400" />
        {(items || []).map((i) => (
          <div key={i.product_id} className="mb-1">
            <p className="font-medium">{i.name}</p>
            <p className="flex justify-between">
              <span>{i.qty} × {fmt(i.price)}</span>
              <span>{fmt(i.price * i.qty - (i.disc || 0))}</span>
            </p>
          </div>
        ))}
        <hr className="my-2 border-dashed border-gray-400" />
        <p className="flex justify-between font-bold"><span>РАЗОМ</span><span>{fmt(sale.total)}</span></p>
        {cash > 0 && <p className="flex justify-between"><span>Готівка</span><span>{fmt(cash)}</span></p>}
        {card > 0 && <p className="flex justify-between"><span>Картка</span><span>{fmt(card)}</span></p>}
        {deferred > 0 && <p className="flex justify-between"><span>Відстрочення</span><span>{fmt(deferred)}</span></p>}
        {change > 0 && cash > Number(sale.total) && <p className="flex justify-between"><span>Решта</span><span>{fmt(change)}</span></p>}
        {sale.fiscal_code && (
          <>
            <hr className="my-2 border-dashed border-gray-400" />
            <p className="text-center text-[10px] font-medium">ФІСКАЛЬНИЙ ЧЕК</p>
            <p className="text-center text-[10px] break-all">{sale.fiscal_code}</p>
          </>
        )}
        <hr className="my-2 border-dashed border-gray-400" />
        <p className="text-center text-[10px]">{settings.receipt_footer || 'Дякуємо за покупку!'}</p>
      </div>
    </div>
  );
}
