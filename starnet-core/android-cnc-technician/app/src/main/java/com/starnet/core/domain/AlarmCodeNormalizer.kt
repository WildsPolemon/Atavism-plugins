package com.starnet.core.domain

object AlarmCodeNormalizer {
    fun normalize(controller: String, raw: String, fanucTypeHint: String? = null): String {
        val token = raw.trim().uppercase().replace("\\s+".toRegex(), "")
        if (controller.uppercase() != "FANUC") return token

        val prefixed = Regex("""^(PS|SV|SP|OT|OH|DS|PW|SW|SR|BG|APC)([0-9]{3,4})$""").find(token)
        if (prefixed != null) {
            val prefix = prefixed.groupValues[1]
            val digits = prefixed.groupValues[2].padStart(4, '0')
            return if (prefix == "APC") "DS$digits" else "$prefix$digits"
        }

        val legacyPs = Regex("""^P/S([0-9]{3,4})$""").find(token)
        if (legacyPs != null) return "PS${legacyPs.groupValues[1].padStart(4, '0')}"

        val plain = Regex("""^([0-9]{3,4})$""").find(token) ?: return token
        val digits = plain.groupValues[1].padStart(4, '0')
        return when (fanucTypeHint) {
            "SERVO" -> "SV$digits"
            "SPINDLE" -> "SP$digits"
            "P/S" -> "PS$digits"
            "OVERTRAVEL" -> "OT$digits"
            "OVERHEAT" -> "OH$digits"
            "DATA" -> "DS$digits"
            else -> digits
        }
    }
}
