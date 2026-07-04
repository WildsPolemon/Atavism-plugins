# StarNet Core — POS система

Веб-POS за зразком [AinurPOS web.ainur.app](https://web.ainur.app/pos/home) (світлий інтерфейс каси: сітка товарів + кошик-таблиця).

Сайт ainurpos.com.ua використовувався лише для **вивчення списку функцій**, не для копіювання маркетингу.

## Модулі (як AinurPOS)

| Модуль | StarNet Core |
|--------|--------------|
| POS | Каса `:5175` — продаж, відкладений чек, split pay, повернення |
| Товари | Штрихкод → автопошук (Open Food Facts) |
| Склад | Залишки, багатосклад |
| Постачальники | База + борги |
| CRM | Клієнти, історія, лояльність |
| Звіти | Продажі, прибуток, фінанси, працівники |
| Адмін | `:5174` — повна панель |

## Запуск

```bash
# Backend
cd starnet-core/backend && composer install
php spark migrate && php spark db:seed StarnetSeeder
php spark serve --host 0.0.0.0 --port 8080

# Admin
cd starnet-core/admin && npm i && npm run dev

# Cashier
cd starnet-core/cashier && npm i && npm run dev

# eStore (static)
cd starnet-core/estore && python3 -m http.server 5176

# Landing
cd starnet-core/landing && npm i && npm run dev
```

**Логіни:** `admin@starnetcore.local` / `admin123` · `cashier@starnetcore.local` / `cashier123`

## Скріншоти

Див. `docs/screenshots/` — адмін-панель, каса, штрихкод lookup, лендінг.

## Референс AinurPOS

- https://ainurpos.com.ua/ — маркетинг
- https://ainurpos.com.ua/pos-dodatok/ — POS
- https://ainurpos.com.ua/programma-dlya-torgovly-y-sklada/ — склад
- https://ainurpos.com.ua/customers-management/ — CRM
