import { useState, useEffect } from 'react';
import { Banknote, CreditCard, HandCoins, Loader2 } from 'lucide-react';
import { fmt } from '../utils';
import { privat24Pay } from '../utils/hardware';

export default function PaymentScreen({ total, customer, settings = {}, printDefault = true, onClose, onPay, onChangeCustomer }) {
  const [tab, setTab] = useState('cash');
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [deferred, setDeferred] = useState(0);
  const [comment, setComment] = useState('');
  const [print, setPrint] = useState(printDefault);
  const [err, setErr] = useState('');
  const [terminalLoading, setTerminalLoading] = useState(false);
  const terminalOn = settings.pos_terminal_enabled === '1';

  const values = { cash, card, deferred };
  const setters = { cash: setCash, card: setCard, deferred: setDeferred };
  const accepted = cash + card + deferred;

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

  const payViaTerminal = async () => {
    setErr('');
    setTerminalLoading(true);
    try {
      const amount = tab === 'card' ? (tabAmount || total) : total;
      const res = await privat24Pay(settings, amount);
      setCard(amount);
      setCash(0);
      setDeferred(0);
      onPay({
        payment_cash: 0,
        payment_card: amount,
        payment_deferred: 0,
        notes: comment + (res.rrn ? ` | RRN: ${res.rrn}` : ''),
        print_receipt: print,
        terminal_auth: res.auth_code,
      });
    } catch (e) { setErr(e.message); }
    finally { setTerminalLoading(false); }
  };

  const confirm = () => {
    setErr('');
    if (deferred > 0 && !customer?.id) { setErr('Для відстрочення оберіть клієнта'); return; }
    if (accepted < total - 0.01) { setErr(`Недостатньо коштів: не вистачає ${fmt(total - accepted)}`); return; }
    onPay({ payment_cash: cash, payment_card: card, payment_deferred: deferred, notes: comment, print_receipt: print });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirm(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const methods = [
    { id: 'cash', label: 'Готівка', Icon: Banknote },
    { id: 'card', label: tab === 'card' ? 'КАРТА' : 'Безготівковий', Icon: CreditCard },
    { id: 'deferred', label: 'Відстрочення', Icon: HandCoins },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-end border-b border-ainur-border px-6 py-4">
        <button type="button" onClick={onClose} className="text-sm font-medium text-ainur-muted">ЗАКРИТИ <span className="text-xs">[ESC]</span></button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-ainur-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Платежі</h2>
          <div className="space-y-2 border-b border-ainur-border pb-4 text-sm">
            <Row label="Підсумок:" value={total} bold />
            <Row label="Готівка:" value={cash} />
            <Row label="Безготівковий:" value={card} />
            <Row label="Відстрочення:" value={deferred} />
            <Row label="Прийнято:" value={accepted} bold />
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Коментар на продаж"
            className="mt-4 w-full rounded border border-ainur-border p-3 text-sm h-24 resize-none" />
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={print} onChange={(e) => setPrint(e.target.checked)} className="h-4 w-4 rounded" />
            Друкувати чек
          </label>
        </div>

        <div className="flex flex-1 flex-col overflow-auto p-8">
          <h2 className="mb-6 text-xl font-semibold">Прийняти оплату</h2>

          <div className="mb-6 flex max-w-lg items-center gap-3 rounded-lg border border-ainur-border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ainur-blue text-white font-bold">
              {(customer?.name || 'К')[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium">{customer?.name || 'Клієнт'}</p>
            </div>
            <button type="button" onClick={onChangeCustomer} className="text-xs font-medium text-ainur-blue hover:underline">ЗМІНЮВАТИ</button>
          </div>

          <div className="mb-6 grid max-w-lg grid-cols-3 gap-3">
            {methods.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`flex flex-col items-center rounded-lg border-2 py-5 transition ${
                  tab === id ? 'border-ainur-blue bg-ainur-blue text-white' : 'border-ainur-border text-ainur-blue'
                }`}>
                <Icon className="mb-2 h-8 w-8" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          <label className="mb-1 text-sm text-ainur-orange">Сума</label>
          <input value={tabAmount || ''} onChange={(e) => setTabAmount(e.target.value)}
            className="mb-4 w-full max-w-md rounded-lg border-2 border-ainur-orange px-4 py-4 text-3xl font-semibold focus:outline-none" />

          {tab === 'cash' && (
            <>
              <p className="mb-2 text-xs text-ainur-muted">Варіанти оплати готівкою</p>
              <div className="mb-6 flex flex-wrap gap-2 max-w-lg">
                {quick.map((q) => (
                  <button key={q} type="button" onClick={() => setTabAmount(q)}
                    className="rounded-lg border border-ainur-border px-4 py-2 text-sm hover:border-ainur-blue">
                    {new Intl.NumberFormat('uk-UA').format(q)}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'card' && terminalOn && (
            <button type="button" onClick={payViaTerminal} disabled={terminalLoading}
              className="mb-4 flex w-full max-w-lg items-center justify-center gap-2 rounded-lg border-2 border-ainur-blue bg-blue-50 py-3 text-sm font-semibold text-ainur-blue hover:bg-blue-100 disabled:opacity-50">
              {terminalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Оплата через термінал Privat24
            </button>
          )}

          {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
          {tab === 'cash' && accepted > total && (
            <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Решта: <strong>{fmt(accepted - total)}</strong>
            </p>
          )}
          <button type="button" onClick={confirm}
            className="mt-auto w-full max-w-lg rounded-lg bg-ainur-blue py-4 text-lg font-bold uppercase text-white hover:bg-ainur-blue-dark">
            ПРИЙНЯТИ {fmt(total).replace(' грн.', 'ГРН.')}
            <span className="float-right text-sm font-normal normal-case opacity-80">[ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className="text-ainur-muted">{label}</span>
      <span>{fmt(value)}</span>
    </div>
  );
}
