# StarNet Core — інсталятор

## Швидке встановлення на хостинг

1. Завантажте архів `starnet-core-hosting.zip` на хостинг
2. Розпакуйте у `public_html/` (або піддомен)
3. Відкрийте **`https://ваш-домен/install/`**
4. Крок 1 — перевірка PHP (автоматично)
5. Крок 2 — URL сайту, email/пароль адміна, **демо-база** ✓
6. Готово — посилання на адмін і касу

## Структура після розпакування

```
/
├── install/      ← майстер встановлення
├── backend/      ← API (SQLite)
├── admin/        ← адмін-панель
├── cashier/      ← каса POS
├── estore/       ← вітрина
└── index.html    → redirect на install/
```

## Демо-логіни

| Роль | Email | Пароль |
|------|-------|--------|
| Адмін | admin@starnetcore.local | admin123 |
| Касир | cashier@starnetcore.local | cashier123 |

## Збірка архіву (для розробників)

```bash
cd starnet-core/scripts
chmod +x build-release.sh
./build-release.sh
```

Архів: `starnet-core/release/starnet-core-hosting.zip`

## Код товару

Генерується автоматично (`P000001`, `P000002`…) при створенні товару в адмінці.
