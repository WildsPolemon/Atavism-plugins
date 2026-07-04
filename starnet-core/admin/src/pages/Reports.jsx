import { useEffect, useState } from 'react';
import { api, fmtUah } from '../api';

export default function Reports() {
  const [fin, setFin] = useState(null);
  useEffect(() => { api.reportFinance().then(setFin); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Звіти</h1>
      <p className="mb-6 text-sm text-muted">Фінанси та аналітика</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass p-6"><p className="text-xs text-muted">Готівка</p><p className="text-2xl font-bold text-success">{fmtUah(fin?.cash)}</p></div>
        <div className="glass p-6"><p className="text-xs text-muted">Картка</p><p className="text-2xl font-bold text-accent-soft">{fmtUah(fin?.card)}</p></div>
        <div className="glass p-6"><p className="text-xs text-muted">Борги</p><p className="text-2xl font-bold text-danger">{fmtUah(fin?.debt)}</p></div>
      </div>
    </div>
  );
}
