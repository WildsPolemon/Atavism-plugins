import { useState } from 'react';

export default function PosSettings({ settings, onClose, onSave }) {
  const [form, setForm] = useState({
    pos_theme: settings.pos_theme || 'light',
    pos_sound: settings.pos_sound || 'on',
    pos_language: settings.pos_language || 'uk',
    pos_print_default: settings.pos_print_default !== '0',
    pos_printer_type: settings.pos_printer_type || 'receipt',
    pos_receipt_width: settings.pos_receipt_width || '80',
    pos_show_zero_stock: settings.pos_show_zero_stock !== '0',
    pos_sort_by: settings.pos_sort_by || 'updated_at',
    pos_sort_dir: settings.pos_sort_dir || 'desc',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => onSave({
    pos_theme: form.pos_theme,
    pos_sound: form.pos_sound,
    pos_language: form.pos_language,
    pos_print_default: form.pos_print_default ? '1' : '0',
    pos_printer_type: form.pos_printer_type,
    pos_receipt_width: form.pos_receipt_width,
    pos_show_zero_stock: form.pos_show_zero_stock ? '1' : '0',
    pos_sort_by: form.pos_sort_by,
    pos_sort_dir: form.pos_sort_dir,
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-ainur-border px-6 py-4">
        <h2 className="text-xl font-semibold">Налаштування</h2>
        <button onClick={onClose} className="text-sm text-ainur-muted">Закрити [ESC]</button>
      </div>
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <Section title="Оформлення">
          <RadioGroup value={form.pos_theme} onChange={(v) => set('pos_theme', v)} options={[
            { v: 'auto', l: 'Автоматично' }, { v: 'light', l: 'Світлий' }, { v: 'dark', l: 'Темний' },
          ]} />
        </Section>
        <Section title="Звук">
          <RadioGroup value={form.pos_sound} onChange={(v) => set('pos_sound', v)} options={[
            { v: 'on', l: 'Увімкнути' }, { v: 'off', l: 'Вимкнути' },
          ]} />
        </Section>
        <Section title="Мова інтерфейсу">
          <select value={form.pos_language} onChange={(e) => set('pos_language', e.target.value)} className="w-full rounded border border-ainur-border px-3 py-2 text-sm">
            <option value="uk">Українська</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </Section>
        <Section title="Друк на принтері">
          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={form.pos_print_default} onChange={(e) => set('pos_print_default', e.target.checked)} />
            Друкувати чек за замовчуванням
          </label>
          <RadioGroup value={form.pos_printer_type} onChange={(v) => set('pos_printer_type', v)} options={[
            { v: 'a4', l: 'Принтер A4' }, { v: 'receipt', l: 'Принтер чека' },
          ]} />
          <label className="mt-3 block text-xs text-ainur-muted">Ширина сторінки (мм)</label>
          <input value={form.pos_receipt_width} onChange={(e) => set('pos_receipt_width', e.target.value)} className="mt-1 w-full rounded border border-ainur-border px-3 py-2 text-sm" />
        </Section>
        <Section title="Товари з нульовим залишком">
          <RadioGroup value={form.pos_show_zero_stock ? 'show' : 'hide'} onChange={(v) => set('pos_show_zero_stock', v === 'show')} options={[
            { v: 'show', l: 'Показувати' }, { v: 'hide', l: 'Не показувати' },
          ]} />
        </Section>
        <Section title="Сортування товарів">
          <select value={form.pos_sort_by} onChange={(e) => set('pos_sort_by', e.target.value)} className="w-full rounded border border-ainur-border px-3 py-2 text-sm mb-2">
            <option value="name">Найменування</option>
            <option value="sale_price">Ціна</option>
            <option value="updated_at">Дата зміни</option>
          </select>
          <RadioGroup value={form.pos_sort_dir} onChange={(v) => set('pos_sort_dir', v)} options={[
            { v: 'asc', l: 'За зростанням' }, { v: 'desc', l: 'За спаданням' },
          ]} />
        </Section>
        <p className="mt-6 text-xs text-ainur-muted">Версія: 4.0.1 (StarNet Core)</p>
      </div>
      <div className="border-t border-ainur-border p-4 flex gap-2">
        <button onClick={save} className="rounded-lg bg-ainur-blue px-6 py-2 text-sm font-semibold text-white">Зберегти</button>
        <button onClick={onClose} className="rounded-lg border border-ainur-border px-6 py-2 text-sm">Скасувати</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <div className="mb-6"><h3 className="mb-3 font-medium text-ainur-blue">{title}</h3>{children}</div>;
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`rounded-lg border px-4 py-2 text-sm ${value === o.v ? 'border-ainur-blue bg-blue-50 text-ainur-blue' : 'border-ainur-border'}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}
