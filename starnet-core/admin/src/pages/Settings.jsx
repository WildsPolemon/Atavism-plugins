export default function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Налаштування</h1>
      <p className="mb-6 text-sm text-slate-400">Чеки, логотип, компанія</p>
      <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="text-xs text-slate-400">Назва компанії</label>
          <input defaultValue="StarNet Core" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Текст внизу чека</label>
          <input defaultValue="Дякуємо за покупку!" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Логотип на чеку (URL)</label>
          <input placeholder="https://..." className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white" />
        </div>
        <button className="rounded-xl bg-indigo-500 px-6 py-2 text-sm font-medium text-white">Зберегти</button>
      </div>
    </div>
  );
}
