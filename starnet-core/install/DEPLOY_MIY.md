# Установка mystfall.miy.link

## 404 = файлы не загружены

Папка сайта на myhosting: **`mystfall.miy.link/public/`**

## Шаги

1. Скачать: `starnet-core/release/starnet-core-hosting.zip` (в main)
2. panel21.myhosting.name → Файловый менеджер → `mystfall.miy.link/public/`
3. Загрузить ZIP → Распаковать **содержимое** сюда (не в подпапку)
4. Проверка: https://mystfall.miy.link/ok.txt
5. Установка: https://mystfall.miy.link/install.php
6. URL: `https://mystfall.miy.link/`

## После установки

- Админ: /admin/
- Касса: /cashier/
- Логин: admin@starnetcore.local / admin123

Структура простая — один корень, без папки api/:

```
public/
  install.php
  index.php
  admin/
  cashier/
  app/
  vendor/
  writable/
```
