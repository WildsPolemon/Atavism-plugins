# StarNet Каса — Android

Нативна каса для Android 7+ (API 24) з підтримкою обладнання як у AinurPOS.

## Можливості

- Логін, відкриття/закриття зміни (синхронізація з Checkbox ПРРО)
- Каталог товарів, кошик, оплата готівка/картка
- **ПРРО Checkbox** — фіскалізація через сервер StarNet Core
- **WiFi принтер** ESC/POS (порт 9100)
- **Ваги USB-COM** (KAS/CAS, FTDI/CH340) через USB OTG
- **Термінал Privat24** — перевірка мережі + підтвердження оплати

## Тестовий APK

Після збірки:
```
app/build/outputs/apk/debug/app-debug.apk
```
або `release/starnet-cashier-android-debug.apk`

## Збірка

```bash
export ANDROID_HOME=~/android-sdk
cd starnet-core/android-cashier
./gradlew assembleDebug
```

## Налаштування

1. Встановіть APK на планшет/термінал Android 7+
2. Увійдіть: URL сервера (напр. `http://192.168.1.10:8080`)
3. Логін касира: `cashier@starnetcore.local` / `cashier123`
4. Налаштування → IP принтера, терміналу, baud ваг

## Мінімальні вимоги

- Android 7.0 (API 24)
- WiFi до сервера StarNet Core
- USB OTG для ваг (опційно)
