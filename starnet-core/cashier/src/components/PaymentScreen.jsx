import { useState, useEffect } from 'react';
import { fmt } from '../utils';

export default function PaymentScreen({ total, customer, onClose, onPay }) {
  const [tab, setTab] = useState('cash');
  const [amount, setAmount] = useState('');
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [deferred, setDeferred] = useState(0);
  const [comment, setComment] = useState('');
  const [print, setPrint] = useState(true);

  const accepted = cash + card + deferred;
  const quick = [total, Math.ceil(total / 5) * 5, 200, 500, 2000, 5000].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 6);

  const applyAmount = (val) => {
    const n = Number(val) || 0;
    setAmount(String(n));
    if (tab === 'cash') { setCash(n); setCard(0); setDeferred(0); }
    else if (tab === 'card') { setCard(n); setCash(0); setDeferred(0); }
    else { setDeferred(n); setCash(0); setCard(0); }
  };

  useEffect(() => { applyAmount(total); }, [total, tab]);

  const confirm = () => onPay({ payment_cash: cash, payment_card: card, notes: comment, print_receipt: print, deferred });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-end border-b border-ainur-border px-4 py-3">
        <button onClick={onClose} className="text-sm font-medium text-ainur-muted hover:text-ainur-text">ЗАКРИТИ <span className="text-xs">[ESC]</span></button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-ainur-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Платежі</h2>
          <div className="space-y-2 text-sm">
            <Row label="Підсумок" value={total} bold />
            <Row label="Готівка" value={cash} />
            <Row label="Безготівковий" value={card} />
            <Row label="Відстрочення" value={deferred} />
            <Row label="Прийнято" value={accepted} bold />
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Коментар на продаж" className="mt-6 w-full rounded border border-ainur-border p-3 text-sm h-24 resize-none" />
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={print} onChange={(e) => setPrint(e.target.checked)} className="rounded" />
            Друкувати чек
          </label>
        </div>
        <div className="flex flex-1 flex-col p-8">
          <h2 className="mb-6 text-xl font-semibold">Прийняти оплату</h2>
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-ainur-border p-4 max-w-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ainur-blue text-white font-bold">{(customer?.name || 'К')[0]}</div>
            <div><p className="font-medium">{customer?.name || 'Клієнт'}</p><p className="text-xs text-ainur-muted">{customer?.phone || 'Не обрано'}</p></div>
          </div>
          <div className="mb-6 grid max-w-lg grid-cols-3 gap-2">
            {[{ id: 'cash', label: 'Готівка', icon: '💵' }, { id: 'card', label: 'Безготівковий', icon: '💳' }, { id: 'deferred', label: 'Відстрочення', icon: '🤝' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-lg border-2 py-4 text-center text-sm font-medium ${tab === t.id ? 'border-ainur-blue bg-blue-50 text-ainur-blue' : 'border-ainur-border'}`}>
                <div className="text-2xl mb-1">{t.icon}</div>{t.label}
              </button>
            ))}
          </div>
          <label className="mb-2 text-sm text-ainur-muted">Сума</label>
          <input value={amount} onChange={(e) => applyAmount(e.target.value)} className="mb-4 w-full max-w-md rounded-lg border-2 border-ainur-orange px-4 py-4 text-2xl font-semibold focus:outline-none" />
          <div className="mb-8 flex flex-wrap gap-2 max-w-lg">
            {quick.map((q) => (
              <button key={q} onClick={() => applyAmount(q)} className="rounded-lg border border-ainur-border bg-white px-4 py-2 text-sm hover:border-ainur-blue">{new Intl.NumberFormat('uk-UA').format(q)}</button>
            ))}
          </div>
          <button onClick={confirm} className="w-full max-w-lg rounded-lg bg-ainur-blue py-4 text-lg font-bold text-white hover:bg-ainur-blue-dark">
            ПРИЙНЯТИ {fmt(total).toUpperCase()} <span className="float-right text-sm font-normal opacity-80">[ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className="text-ainur-muted">{label}</span><span>{fmt(value)}</span>
    </div>
  );
}
