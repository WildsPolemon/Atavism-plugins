import { useRef, useEffect } from 'react';
import { ScanBarcode } from 'lucide-react';

export default function BarcodeModal({ onScan, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const submit = (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get('code')?.toString().trim();
    if (code) onScan(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <ScanBarcode className="h-8 w-8 text-ainur-blue" />
          <div>
            <h3 className="font-semibold">Сканер штрих-кодів</h3>
            <p className="text-xs text-ainur-muted">Відскануйте або введіть код вручну</p>
          </div>
        </div>
        <input ref={ref} name="code" autoComplete="off" placeholder="Штрихкод..." className="w-full rounded-lg border-2 border-ainur-orange px-4 py-3 text-lg font-mono focus:outline-none" />
        <div className="mt-4 flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-ainur-blue py-2 text-sm font-semibold text-white">Додати</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-ainur-border px-4 py-2 text-sm">Закрити</button>
        </div>
      </form>
    </div>
  );
}
