package ua.starnet.cashier.hardware

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Privat24 POS terminal — TCP ping + manual confirm (як web-каса).
 * Реальний протокол залежить від моделі терміналу; тут базова перевірка мережі.
 */
class Privat24Terminal(private val ip: String, private val port: Int = 2000) {
    suspend fun ping(): Boolean = withContext(Dispatchers.IO) {
        if (ip.isBlank()) return@withContext true
        try {
            Socket().use { s ->
                s.connect(InetSocketAddress(ip, port), 3000)
                true
            }
        } catch (_: Exception) {
            false
        }
    }

    suspend fun pay(amount: Double, onConfirm: suspend (Double) -> Boolean): PayResult {
        if (ip.isNotBlank() && !ping()) {
            throw IllegalStateException("Термінал Privat24 ($ip:$port) недоступний у мережі")
        }
        val ok = onConfirm(amount)
        if (!ok) throw IllegalStateException("Оплату скасовано")
        return PayResult(rrn = "TX${System.currentTimeMillis()}", authCode = "", cardMask = "")
    }

    data class PayResult(val rrn: String, val authCode: String, val cardMask: String)
}
