export const fmt = (n) => `${new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0)} грн.`;

export function nowUk() {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date());
}
