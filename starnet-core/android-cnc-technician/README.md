# Starnet Core (Valchuk Ivan) - Android

Real CNC setup assistant for shop-floor daily work.

## Core implemented modules

1. AI alarm diagnostics:
   - FANUC / Siemens / Mitsubishi alarm lookup
   - causes and step-by-step checks
2. Photo recognition:
   - image import from device
   - OCR text extraction (ML Kit)
   - AI-style interpretation summary
3. CNC calculators:
   - turning RPM
   - milling feed
   - drilling time
4. Coordinate calculator:
   - bolt circle / PCD points
   - angle stepping
5. Thread reference:
   - metric / pipe / inch examples
   - pitch, diameters, tap drill
6. Tool database (local Room DB):
   - tool number, type, insert, holder, diameter, material, photo uri, notes
7. Setup checklist (local Room DB):
   - default startup checks
   - custom checklist lines
8. Work journal (local Room DB):
   - part number, machine, program, tool, problems, solutions, timestamp

## Build

```bash
cd android-cnc-technician
./gradlew assembleDebug
```

Debug APK:

`app/build/outputs/apk/debug/app-debug.apk`

## Package identity

- App name: `Starnet Core`
- Product owner string in UI: `Valchuk Ivan`
- Namespace/Application ID: `com.starnet.core`

## Notes

- Current version stores data locally in Room database (`starnet_core.db`).
- For production fleet use, add backend sync, role management, and backup/restore.

## Alarm Knowledge Base Engine

- Local seed file: `app/src/main/assets/alarm_seed_v1.json`
- Room tables: `alarm_codes`, `kb_meta`
- Model-specific parser module: `domain/AlarmParser.kt`
- Remote sync client (revision + delta alarms):
  - `GET /cnc-kb/revision`
  - `GET /cnc-kb/alarms?fromRevision=<int>`
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
