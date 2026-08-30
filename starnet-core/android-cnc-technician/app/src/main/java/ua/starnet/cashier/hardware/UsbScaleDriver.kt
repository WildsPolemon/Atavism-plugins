package ua.starnet.cashier.hardware

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import java.io.IOException

class UsbScaleDriver(private val context: Context) {
    private var port: UsbSerialPort? = null

    fun listDevices(): List<UsbDevice> {
        val mgr = context.getSystemService(Context.USB_SERVICE) as UsbManager
        return mgr.deviceList.values.toList()
    }

    suspend fun connect(device: UsbDevice, baud: Int = 9600): Boolean = withContext(Dispatchers.IO) {
        val mgr = context.getSystemService(Context.USB_SERVICE) as UsbManager
        if (!mgr.hasPermission(device)) {
            val pi = PendingIntent.getBroadcast(context, 0, Intent(ACTION_USB), PendingIntent.FLAG_IMMUTABLE)
            mgr.requestPermission(device, pi)
            throw IOException("Потрібен дозвіл USB — підтвердіть і спробуйте знову")
        }
        val driver = UsbSerialProber.getDefaultProber().probeDevice(device)
            ?: throw IOException("Непідтримуваний USB-пристрій")
        val connection = mgr.openDevice(device) ?: throw IOException("Не вдалося відкрити USB")
        val serialPort = driver.ports[0]
        serialPort.open(connection)
        serialPort.setParameters(baud, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
        port = serialPort
        true
    }

    suspend fun connectFirst(baud: Int = 9600): Boolean {
        val devices = listDevices()
        if (devices.isEmpty()) throw IOException("USB ваги не знайдено")
        return connect(devices.first(), baud)
    }

    suspend fun readWeight(timeoutMs: Long = 4000, protocol: String = "auto"): Double = withContext(Dispatchers.IO) {
        val p = port ?: throw IllegalStateException("Ваги не підключені")
        val buf = ByteArray(256)
        val deadline = System.currentTimeMillis() + timeoutMs
        val acc = StringBuilder()
        withTimeout(timeoutMs + 500) {
            while (System.currentTimeMillis() < deadline) {
                val n = p.read(buf, 200)
                if (n > 0) {
                    acc.append(String(buf, 0, n, Charsets.UTF_8))
                    parseWeight(acc.toString(), protocol)?.let { return@withTimeout it }
                }
            }
        }
        throw IOException("Покладіть товар на ваги")
    }

    fun disconnect() {
        try { port?.close() } catch (_: Exception) {}
        port = null
    }

    companion object {
        const val ACTION_USB = "ua.starnet.cashier.USB_PERMISSION"

        fun parseWeight(text: String, protocol: String): Double? {
            if (protocol == "cas" || protocol == "auto") {
                Regex("""[SW][NT]?\s*(\d+[.,]\d+)""", RegexOption.IGNORE_CASE).find(text)?.let {
                    return it.groupValues[1].replace(',', '.').toDoubleOrNull()
                }
            }
            Regex("""(\d+[.,]\d+)""").find(text)?.let {
                return it.groupValues[1].replace(',', '.').toDoubleOrNull()
            }
            return null
        }
    }
}
