import { useState, useEffect } from 'react';
import { fmt } from '../utils';

export default function PaymentScreen({ total, customer, printDefault = true, onClose, onPay }) {
  const [tab, setTab] = useState('cash');
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [deferred, setDeferred] = useState(0);
  const [comment, setComment] = useState('');
  const [print, setPrint] = useState(printDefault);
  const [err, setErr] = useState('');

  const values = { cash, card, deferred };
  const setters = { cash: setCash, card: setCard, deferred: setDeferred };
  const accepted = cash + card + deferred;
  const remaining = Math.max(0, total - (cash + card + deferred - values[tab]));

  const setTabAmount = (val) => {
    const n = Math.max(0, Number(val) || 0);
    setters[tab](n);
  };

  const tabAmount = values[tab];
  const quick = [total, Math.ceil(total / 5) * 5 || total, 200, 500, 2000, 5000]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  useEffect(() => {
    setCash(total);
    setCard(0);
    setDeferred(0);
    setTab('cash');
  }, [total]);

  const confirm = () => {
    setErr('');
    if (deferred > 0 && !customer?.id) {
      setErr('Для відстрочення оберіть клієнта');
      return;
    }
    if (accepted < total - 0.01) {
      setErr(`Недостатньо коштів: не вистачає ${fmt(total - accepted)}`);
      return;
    }
    onPay({ payment_cash: cash, payment_card: card, payment_deferred: deferred, notes: comment, print_receipt: print });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirm(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
            <Row label="Готівка" value={cash} active={tab === 'cash'} onClick={() => setTab('cash')} />
            <Row label="Безготівковий" value={card} active={tab === 'card'} onClick={() => setTab('card')} />
            <Row label="Відстрочення" value={deferred} active={tab === 'deferred'} onClick={() => setTab('deferred')} />
            <Row label="Прийнято" value={accepted} bold />
            {accepted > total && <Row label="Решта" value={accepted - total} />}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Коментар на продаж" className="mt-6 w-full rounded border border-ainur-border p-3 text-sm h-24 resize-none" />
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={print} onChange={(e) => setPrint(e.target.checked)} className="rounded" />
            Друкувати чек
          </label>
          <p className="mt-4 text-xs text-ainur-muted">Комбінована оплата: введіть суми для кожного типу окремо</p>
        </div>
        <div className="flex flex-1 flex-col p-8">
          <h2 className="mb-6 text-xl font-semibold">Прийняти оплату</h2>
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-ainur-border p-4 max-w-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ainur-orange text-white font-bold">{(customer?.name || 'К')[0]}</div>
            <div>
              <p className="font-medium">{customer?.name || 'Клієнт'}</p>
              <p className="text-xs text-ainur-muted">{customer?.phone || 'Не обрано'}{customer?.debt > 0 ? ` · Борг: ${fmt(customer.debt)}` : ''}</p>
            </div>
          </div>
          <div className="mb-6 grid max-w-lg grid-cols-3 gap-2">
            {[{ id: 'cash', label: 'Готівка', icon: '💵' }, { id: 'card', label: tab === 'card' ? 'КАРТА' : 'Безготівковий', icon: '💳' }, { id: 'deferred', label: 'Відстрочення', icon: '🤝' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-lg border-2 py-4 text-center text-sm font-medium ${tab === t.id ? 'border-ainur-blue bg-blue-50 text-ainur-blue' : 'border-ainur-border'}`}>
                <div className="text-2xl mb-1">{t.icon}</div>{t.label}
                <div className="text-xs mt-1">{fmt(values[t.id])}</div>
              </button>
            ))}
          </div>
          <label className="mb-2 text-sm text-ainur-muted">Сума ({tab === 'cash' ? 'готівка' : tab === 'card' ? 'картка' : 'відстрочення'})</label>
          <input value={tabAmount || ''} onChange={(e) => setTabAmount(e.target.value)} className="mb-4 w-full max-w-md rounded-lg border-2 border-ainur-orange px-4 py-4 text-2xl font-semibold focus:outline-none" />
          <div className="mb-4 flex flex-wrap gap-2 max-w-lg">
            {quick.map((q) => (
              <button key={q} type="button" onClick={() => setTabAmount(q)} className="rounded-lg border border-ainur-border bg-white px-4 py-2 text-sm hover:border-ainur-blue">{new Intl.NumberFormat('uk-UA').format(q)}</button>
            ))}
            <button type="button" onClick={() => { setCash(0); setCard(0); setDeferred(0); }} className="rounded-lg border border-red-200 text-red-600 px-4 py-2 text-sm">Скинути</button>
          </div>
          {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
          <button onClick={confirm} className="w-full max-w-lg rounded-lg bg-ainur-green py-4 text-lg font-bold text-white hover:opacity-90">
            ПРИЙНЯТИ {fmt(total).toUpperCase()} <span className="float-right text-sm font-normal opacity-80">[ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex justify-between rounded px-1 py-0.5 ${active ? 'bg-blue-50' : ''} ${onClick ? 'cursor-pointer' : ''} ${bold ? 'font-semibold' : ''}`}>
      <span className="text-ainur-muted">{label}</span><span>{fmt(value)}</span>
    </div>
  );
}
