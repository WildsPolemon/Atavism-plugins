# StarNet Core

Повний аналог [AinurPOS](https://ainurpos.com.ua/) на **CodeIgniter 4** + React.

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
