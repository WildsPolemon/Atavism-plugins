Starnet Core Valchuk Ivan - Debug APK (split archive)

GitHub blocks files larger than 100MB, so app-debug.apk is stored as chunks:
- app-debug.apk.part-00
- app-debug.apk.part-01
- app-debug.apk.part-02

Restore full APK:

Linux/macOS:
cat app-debug.apk.part-* > app-debug.apk

Windows PowerShell:
Get-Content .\app-debug.apk.part-* -AsByteStream | Set-Content .\app-debug.apk -AsByteStream

Verify checksum:
sha256sum -c app-debug.apk.sha256
