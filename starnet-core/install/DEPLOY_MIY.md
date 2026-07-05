# Встановлення на mystfall.miy.link (та ін. nginx-хостинг)

## Чому 404?

Сервер відповідає стандартною сторінкою nginx — **файли ще не завантажені** в корінь сайту.

## Кроки

### 1. Завантажте архів

З репозиторію: `starnet-core/release/starnet-core-hosting.zip`

### 2. Розпакуйте в корінь сайту

У файловому менеджері хостингу (panel21.myhosting.name):

```
public_html/          ← корінь mystfall.miy.link
├── install/
│   └── index.php
├── backend/
├── admin/
├── cashier/
├── api/
│   └── index.php
├── index.php
└── index.html
```

**Важливо:** розпакуйте **вміст** архіву прямо в `public_html/`,  
не папку `starnet-core` всередині ще однієї папки.

### 3. Відкрийте інсталятор

```
https://mystfall.miy.link/install/index.php
```

(на nginx `/install/` без `index.php` може дати 404 — використовуйте повний шлях)

### 4. У формі вкажіть URL

```
https://mystfall.miy.link/
```

(зі слешем в кінці)

### 5. Після встановлення

| Модуль | URL |
|--------|-----|
| Адмін | https://mystfall.miy.link/admin/ |
| Каса | https://mystfall.miy.link/cashier/ |
| API | https://mystfall.miy.link/api/ |

## Перевірка завантаження

Якщо після upload все ще 404 — відкрийте:

```
https://mystfall.miy.link/install/index.php
```

Якщо бачите «StarNet Core — Інсталятор» — файли на місці.

## nginx

На nginx `.htaccess` не працює. У архіві є папка `api/` з `index.php` для API.  
Якщо API не відповідає — додайте правила з `deploy/nginx.conf.example` у панелі хостингу.

## Права доступу

```bash
chmod -R 755 backend/writable
```

## Демо-логіни

- admin@starnetcore.local / admin123
- cashier@starnetcore.local / cashier123
