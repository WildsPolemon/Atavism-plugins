package ua.starnet.cashier.hardware

import android.content.Context
import ua.starnet.cashier.data.Prefs

class HardwareManager(private val context: Context) {
    private val scale = UsbScaleDriver(context)

    suspend fun printerIp(): String = Prefs.getPrinterIp()
    suspend fun terminalIp(): String = Prefs.getTerminalIp()

    suspend fun printReceipt(lines: List<String>) {
        val ip = Prefs.getPrinterIp()
        if (ip.isBlank()) throw IllegalStateException("Вкажіть IP WiFi-принтера в налаштуваннях")
        WifiPrinter(ip).printLines(lines)
    }

    suspend fun testPrinter() = WifiPrinter(Prefs.getPrinterIp()).testPrint()

    suspend fun connectScale(): Boolean = scale.connectFirst(Prefs.getScaleBaud())

    suspend fun readScaleWeight(): Double = scale.readWeight(protocol = "auto")

    suspend fun testScale(): String = "Вага: ${readScaleWeight()} кг"

    fun scaleConnected(): Boolean = scale.listDevices().isNotEmpty()

    suspend fun privat24Pay(amount: Double, onConfirm: suspend (Double) -> Boolean): Privat24Terminal.PayResult {
        return Privat24Terminal(Prefs.getTerminalIp()).pay(amount, onConfirm)
    }

    suspend fun testTerminal(): String {
        val ip = Prefs.getTerminalIp()
        return if (ip.isBlank()) "Термінал готовий — підтвердження на пристрої"
        else if (Privat24Terminal(ip).ping()) "Термінал Privat24: $ip — OK"
        else "Термінал $ip — не відповідає (перевірте WiFi)"
    }
}
