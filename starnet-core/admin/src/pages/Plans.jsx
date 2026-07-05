const PLANS = [
  { name: 'Базовий', price: '$0', features: ['1 каса', '100 товарів', 'Базові звіти', 'Веб-каса'] },
  { name: 'Ощадливий', price: '$9/міс', features: ['3 каси', '1000 товарів', 'CRM', 'eStore'] },
  { name: 'Оптимальний', price: '$19/міс', features: ['5 кас', '5000 товарів', 'Звіти по працівниках', 'Інтеграції'] },
  { name: 'Професійний', price: '$49/міс', features: ['10 кас', 'Необмежено товарів', 'Конструктор звітів', 'Пріоритетна підтримка'] },
  { name: 'Необмежений', price: '$89/міс', features: ['Все без лімітів', 'API', 'Мульти-магазин', 'White-label'] },
];

export default function Plans() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ainur-text">Тарифи і оплата</h1>
      <p className="mb-6 text-sm text-ainur-muted">StarNet Core — безкоштовна self-hosted версія. Тарифи за зразком AinurPOS.</p>

      <div className="mb-6 rounded-xl border border-ainur-orange/30 bg-orange-50 p-4">
        <p className="font-medium text-ainur-text">Поточний тариф: <span className="text-ainur-orange">Self-hosted (Безкоштовно)</span></p>
        <p className="mt-1 text-sm text-ainur-muted">Ви використовуєте власний хостинг. Обмежень AinurPOS cloud не застосовується.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={`glass p-5 ${p.name === 'Базовий' ? 'ring-2 ring-ainur-blue' : ''}`}>
            <p className="text-lg font-bold text-ainur-text">{p.name}</p>
            <p className="mt-1 text-2xl font-bold text-ainur-blue">{p.price}</p>
            <ul className="mt-4 space-y-1 text-sm text-ainur-muted">
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            {p.name === 'Базовий' && (
              <p className="mt-4 rounded-lg bg-ainur-blue/10 px-3 py-2 text-xs text-ainur-blue font-medium">Активний план</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
