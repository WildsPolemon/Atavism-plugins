package com.starnet.core.domain

data class FanucOcrDetection(
    val modelFamily: String?,
    val alarmType: String?,
    val rawCode: String?,
    val confidence: Float,
    val candidateCodes: List<String>
)

object FanucScreenAnalyzer {
    fun detect(sourceText: String): FanucOcrDetection {
        val text = sourceText.uppercase()
        val model = detectModelFamily(text)
        val alarmType = detectAlarmType(text)
        val rawCode = detectCode(text)
        val candidates = detectCandidateCodes(text)
        val confidence = scoreConfidence(model, alarmType, rawCode, candidates)
        return FanucOcrDetection(
            modelFamily = model,
            alarmType = alarmType,
            rawCode = rawCode,
            confidence = confidence,
            candidateCodes = candidates
        )
    }

    private fun detectModelFamily(text: String): String? {
        val patterns = listOf(
            Regex("""\b(0I[-\s]?TF)\b""") to "0I-TF",
            Regex("""\b(0I[-\s]?TD)\b""") to "0I-TD",
            Regex("""\b(0I[-\s]?MATE[-\s]?D)\b""") to "0I-MATE-D",
            Regex("""\b(0I[-\s]?D)\b""") to "0I-D",
            Regex("""\b(31I(?:[-\s]?MODEL[-\s]?[AB])?)\b""") to "31I",
            Regex("""\b(30I(?:[-\s]?MODEL[-\s]?[AB])?)\b""") to "30I",
            Regex("""\b(32I(?:[-\s]?MODEL[-\s]?[AB])?)\b""") to "32I",
            Regex("""\b(16I|18I|21I)\b""") to "16I/18I/21I"
        )
        return patterns.firstNotNullOfOrNull { (regex, family) ->
            if (regex.containsMatchIn(text)) family else null
        }
    }

    private fun detectAlarmType(text: String): String? {
        val hasAlarmContext = hasAlarmContext(text)
        return when {
            Regex("""\bSV\b|\bSERVO\b""").containsMatchIn(text) -> "SERVO"
            Regex("""\bSP\b|\bSPINDLE\b|\bRIGID\s*TAP\b""").containsMatchIn(text) -> "SPINDLE"
            Regex("""\bP/?S\b|\bPS\b""").containsMatchIn(text) -> "P/S"
            hasAlarmContext && Regex("""\bPMC\b|\bLADDER\b""").containsMatchIn(text) -> "PMC"
            Regex("""\bOT\b|\bOVER\s*TRAVEL\b""").containsMatchIn(text) -> "OVERTRAVEL"
            Regex("""\bOH\b|\bOVERHEAT\b""").containsMatchIn(text) -> "OVERHEAT"
            Regex("""\bDS\b|\bAPC\b""").containsMatchIn(text) -> "DATA"
            else -> null
        }
    }

    private fun detectCode(text: String): String? {
        val hasAlarmContext = hasAlarmContext(text)
        val prefixed = Regex("""\b(PS|SV|SP|OT|OH|DS|PW|SW|SR|BG|APC)\s*[-:/]?\s*([0-9]{3,4})\b""")
            .find(text)
        if (prefixed != null) {
            val prefix = prefixed.groupValues[1]
            val digits = prefixed.groupValues[2]
            return "$prefix$digits"
        }
        val psLegacy = Regex("""\bP/S\s*([0-9]{3,4})\b""").find(text)
        if (psLegacy != null) return "PS${psLegacy.groupValues[1]}"
        if (!hasAlarmContext) return null
        val plain = Regex("""\b([0-9]{3,4})\b""").find(text)
        return plain?.groupValues?.get(1)
    }

    private fun detectCandidateCodes(text: String): List<String> {
        val hasAlarmContext = hasAlarmContext(text)
        val prefixedMatches = Regex("""\b(PS|SV|SP|OT|OH|DS|PW|SW|SR|BG|APC)\s*[-:/]?\s*([0-9]{3,4})\b""")
            .findAll(text)
            .map {
                val prefix = it.groupValues[1]
                val digits = it.groupValues[2]
                "$prefix$digits"
            }
            .toList()
        if (prefixedMatches.isNotEmpty()) return prefixedMatches.distinct().take(3)
        if (!hasAlarmContext) return emptyList()

        return Regex("""\b([0-9]{3,4})\b""")
            .findAll(text)
            .map { it.groupValues[1] }
            .filter { it != "2024" && it != "2025" && it != "2026" }
            .distinct()
            .take(3)
            .toList()
    }

    private fun scoreConfidence(model: String?, alarmType: String?, rawCode: String?, candidates: List<String>): Float {
        var score = 0f
        if (model != null) score += 0.3f
        if (alarmType != null) score += 0.25f
        if (rawCode != null) score += 0.35f
        if (candidates.size > 1) score += 0.1f
        return score.coerceIn(0f, 1f)
    }

    private fun hasAlarmContext(text: String): Boolean {
        return Regex("""\b(ALARM|ALM|ERROR|ERR|FAULT|WARNING)\b""").containsMatchIn(text)
    }
}
