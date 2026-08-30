package ua.starnet.cashier.hardware

object EscPosEncoder {
    fun receipt(lines: List<String>): ByteArray {
        val esc = 0x1B.toByte()
        val gs = 0x1D.toByte()
        val out = mutableListOf<Byte>()
        out.addAll(listOf(esc, '@'.code.toByte()))
        lines.forEach { line ->
            line.toByteArray(Charsets.UTF_8).forEach { out.add(it) }
            out.add('\n'.code.toByte())
        }
        out.addAll(listOf(gs, 'V'.code.toByte(), 0))
        return out.toByteArray()
    }
}
