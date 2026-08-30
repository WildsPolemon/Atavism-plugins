package ua.starnet.cashier.hardware

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Socket

class WifiPrinter(private val ip: String, private val port: Int = 9100) {
    suspend fun print(data: ByteArray) = withContext(Dispatchers.IO) {
        if (ip.isBlank()) throw IllegalStateException("IP принтера не вказано")
        Socket().use { socket ->
            socket.connect(InetSocketAddress(ip, port), 5000)
            socket.getOutputStream().use { it.write(data); it.flush() }
        }
    }

    suspend fun printLines(lines: List<String>) = print(EscPosEncoder.receipt(lines))

    suspend fun testPrint() = printLines(listOf(
        "StarNet Core",
        "--- ТЕСТ ДРУКУ ---",
        java.text.SimpleDateFormat("dd.MM.yyyy HH:mm", java.util.Locale("uk")).format(java.util.Date()),
        "Принтер OK",
    ))
}
