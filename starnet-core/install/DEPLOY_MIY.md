# mystfall.miy.link — встановлення StarNet Core

## Помилка 404 = файли НЕ в корені сайту

Якщо **будь-який** URL (навіть `/ok.txt`) дає 404 — архів ще не розпаковано в `public_html`.

---

## Крок 1. Завантажте ZIP

З GitHub (гілка `main`):

```
https://github.com/WildsPolemon/Atavism-plugins/raw/main/starnet-core/release/starnet-core-hosting.zip
```

Або з репозиторію: `starnet-core/release/starnet-core-hosting.zip`

---

## Крок 2. Панель хостингу

1. Увійдіть: **panel21.myhosting.name**
2. Файловий менеджер → **`public_html`** (корінь домену mystfall.miy.link)
3. Завантажте `starnet-core-hosting.zip`
4. **Розпакуйте (Extract) прямо в `public_html`**

### Як має виглядати public_html після розпакування:

```
public_html/
├── ok.txt          ← перевірка
├── install.php     ← інсталятор
├── install/
├── backend/
├── admin/
├── cashier/
├── api/
└── index.html
```

### НЕПРАВИЛЬНО (дасть 404):

```
public_html/starnet-core-hosting/install.php   ❌
public_html/starnet-core/install.php           ❌
```

Файли `install.php` і `ok.txt` мають лежати **безпосередньо** в `public_html/`.

---

## Крок 3. Перевірка

Відкрийте в браузері:

```
https://mystfall.miy.link/ok.txt
```

- **Бачите текст** «StarNet Core — файли завантажено правильно» → все ОК
- **404** → файли не в тому каталозі, повторіть крок 2

---

## Крок 4. Інсталятор

```
https://mystfall.miy.link/install.php
```

У формі URL сайту:

```
https://mystfall.miy.link/
```

Увімкніть «Завантажити демо-базу» → **Встановити**.

---

## Після встановлення

| Модуль | URL |
|--------|-----|
| Адмін | https://mystfall.miy.link/admin/ |
| Каса | https://mystfall.miy.link/cashier/ |

**Логіни:** admin@starnetcore.local / admin123

---

## Якщо ok.txt працює, а install.php — ні

- Перевірте версію PHP у панелі (потрібно **8.1+**)
- Права: `chmod -R 755 backend/writable`

## Якщо API не працює після install

Додайте правила з `nginx.conf.example` у панелі хостингу.
