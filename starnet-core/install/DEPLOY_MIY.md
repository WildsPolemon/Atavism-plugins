# mystfall.miy.link — встановлення StarNet Core

## 404 = файли не в тій папці

На **myhosting** (panel21.myhosting.name) корінь сайту — **НЕ** `public_html`!

Правильний шлях:

```
/mystfall.miy.link/public/
```

---

## Крок 1. Завантажте ZIP

https://github.com/WildsPolemon/Atavism-plugins/raw/main/starnet-core/release/starnet-core-hosting.zip

Або спочатку тестовий архів (2 КБ):

https://github.com/WildsPolemon/Atavism-plugins/raw/main/starnet-core/release/upload-test.zip

---

## Крок 2. Панель хостингу

1. Увійдіть: **panel21.myhosting.name**
2. Знайдіть домен **mystfall.miy.link**
3. Натисніть **«Файловий менеджер»** під цим доменом  
   (або FTP → папка `/mystfall.miy.link/public/`)
4. Завантажте ZIP у цю папку
5. **Розпакуйте (Extract)** прямо тут

### Як має виглядати папка `public/`:

```
mystfall.miy.link/public/
├── ok.txt
├── install.php
├── backend/
├── admin/
├── install/
└── index.html
```

### НЕПРАВИЛЬНО (404):

| Куди завантажили | Результат |
|------------------|-----------|
| `public_html/` (корінь акаунту) | 404 |
| `public_html/mystfall.miy.link/` | 404 |
| `mystfall.miy.link/public/starnet-core-hosting/` | 404 |

Файл `ok.txt` має лежати **безпосередньо** в `mystfall.miy.link/public/ok.txt`

---

## Крок 3. Перевірка

```
https://mystfall.miy.link/ok.txt
```

- **Текст** «StarNet Core — файли завантажено правильно» → ОК
- **404 Page Not Found** → не та папка, повторіть крок 2

---

## Крок 4. Інсталятор

```
https://mystfall.miy.link/install.php
```

URL сайту: `https://mystfall.miy.link/` → демо-база → **Встановити**

---

## Після встановлення

| Модуль | URL |
|--------|-----|
| Адмін | https://mystfall.miy.link/admin/ |
| Каса | https://mystfall.miy.link/cashier/ |

Логін: `admin@starnetcore.local` / `admin123`

---

## FTP (альтернатива)

- Хост: `panel21.myhosting.name`
- Порт: 21 (TLS)
- Папка: `/mystfall.miy.link/public/`

## Якщо ok.txt працює, install.php — ні

PHP 8.1+ у панелі, права `chmod 755 backend/writable`
