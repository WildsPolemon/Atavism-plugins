# Atavism Admin Dashboard

Окремий модуль веб-адмінки для Atavism MMO сервера — dark SaaS dashboard з повною статистикою: онлайн, реєстрації, логіни, акаунти, статус сервера.

Дизайн натхненний [SaaSlu Premium SaaS Admin Dashboard](https://www.behance.net/gallery/251348755/SaaSlu-Premium-SaaS-Admin-Dashboard-Template-RTL).

## Структура

```
admin_dashboard/
├── api/          # Express REST API → MySQL atavism_admin
├── web/          # React + Vite + Tailwind (dark theme)
└── sql/          # Опційні таблиці для аналітики
```

## Вимоги

- Node.js 18+
- MySQL/MariaDB з базою `atavism_admin` (стандартна Atavism admin DB)
- Таблиці: `account`, `server_stats`, `server_status`, `data_logs` (опційно)

## Швидкий старт

### 1. API

```bash
cd admin_dashboard/api
cp .env.example .env
# Відредагуйте DB_HOST, DB_USER, DB_PASSWORD
npm install
npm run dev
```

API: http://localhost:4000

### 2. Web UI

```bash
cd admin_dashboard/web
npm install
npm run dev
```

Dashboard: http://localhost:5173

### 3. Історія онлайну (опційно)

```bash
mysql -u root -p atavism_admin < admin_dashboard/sql/online_snapshots.sql
```

Cron кожні 5 хвилин:

```sql
INSERT INTO online_snapshots (players_online)
SELECT players_online FROM server_stats LIMIT 1;
```

## API Endpoints

| Method | Path | Опис |
|--------|------|------|
| GET | `/api/stats/overview` | KPI: онлайн, акаунти, логіни/реєстрації сьогодні |
| GET | `/api/stats/registrations?days=30` | Реєстрації по днях |
| GET | `/api/stats/logins?days=30` | Логіни з `data_logs` або `account.last_login` |
| GET | `/api/stats/online-history?hours=24` | Історія онлайну |
| GET | `/api/stats/events?limit=50` | Останні події |
| GET | `/api/stats/event-breakdown?days=30` | Розбивка подій |
| GET | `/api/accounts?page=1&search=` | Список акаунтів |
| GET | `/api/server/status` | Статус world server |
| GET | `/api/server/health` | Health check БД |

## Production

```bash
# API
cd admin_dashboard/api && npm start

# Web build + serve
cd admin_dashboard/web
npm run build
# Статику з dist/ можна віддавати через nginx, API проксувати на :4000
```

Змінна `VITE_API_URL` — базовий URL API для production (за замовчуванням порожня, dev proxy).

## Джерела даних

- **Онлайн** — `server_stats.players_online`
- **Реєстрації** — `account.created`
- **Логіни** — `data_logs` (`PLAYER_LOGGED_IN_EVENT`) або fallback `account.last_login`
- **Події** — `data_logs` (login/logout, character created)
- **Статус сервера** — `server_status.status`

## Сторінки dashboard

- **Огляд** — KPI + графіки реєстрацій/логінів + останні події
- **Онлайн** — поточний онлайн + історія
- **Логіни** — детальна статистика входів
- **Реєстрації** — нові акаунти
- **Акаунти** — таблиця з пошуком і пагінацією
- **Сервер** — статус world server і health check
