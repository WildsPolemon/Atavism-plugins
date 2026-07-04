# StarNet Core — повний аналог AinurPOS

Джерела: [ainurpos.com.ua](https://ainurpos.com.ua/)

## Статус реалізації

| Модуль AinurPOS | StarNet Core | Статус |
|-----------------|--------------|--------|
| POS — продаж на одному екрані | `cashier/` | ✅ |
| Сканер штрихкодів | Barcode API + миттєве додавання | ✅ |
| Пошук клієнтів (ім'я, телефон, картка) | POS search + CRM | ✅ |
| Знижки (чек / клієнт %) | POS discount + loyalty | ✅ |
| Відкладений чек | hold/restore | ✅ |
| Split pay (готівка + картка) | POS | ✅ |
| Повернення | returnSale + restock | ✅ |
| X/Z-звіти, зміна | POS UI | ✅ |
| Шаблони чеків / друк | receipt settings + print | ✅ |
| Товари + автопошук штрихкоду | Products + Open Food Facts | ✅ |
| Закупівлі постачальникам | `purchases/` | ✅ |
| Списання / коригування | warehouse operations | ✅ |
| Переміщення між складами | transfer operation | ✅ |
| Інвентаризація | `inventory/` | ✅ |
| Багатосклад | warehouses + stock | ✅ |
| Постачальники + борги | suppliers | ✅ |
| CRM + лояльність | CRM + loyalty points | ✅ |
| Історія покупок | customer detail | ✅ |
| Імпорт/експорт | CSV export/import | ✅ |
| Цінники / етикетки | price-tags print | ✅ |
| Звіти (продажі, прибуток, працівники) | reports | ✅ |
| eStore | `estore/` + admin orders | ✅ |
| Налаштування компанії/чеків | settings API | ✅ |
| Мобільні додатки (Android/iOS) | Web-first (PWA-ready) | ⚠️ Web |
| Фіскалізація / PRRO | — | ❌ майбутнє |
| Конструктор звітів (drag-drop) | базові звіти | ⚠️ частково |

## Запуск

```bash
# API :8080 · Admin :5174 · Cashier :5175 · eStore :5176
cd starnet-core/backend && php spark serve --port 8080
cd starnet-core/admin && npm run dev
cd starnet-core/cashier && npm run dev
cd starnet-core/estore && python3 -m http.server 5176
```

**Логіни:** `admin@starnetcore.local` / `admin123` · `cashier@starnetcore.local` / `cashier123`
