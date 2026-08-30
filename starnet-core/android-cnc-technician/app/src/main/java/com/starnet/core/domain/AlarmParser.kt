package com.starnet.core.domain

data class ParsedAlarm(
    val code: String,
    val matchedPattern: String
)

object AlarmParser {
    fun parse(controller: String, modelFamily: String, sourceText: String): ParsedAlarm? {
        val text = sourceText.uppercase()
        return when (controller.uppercase()) {
            "FANUC" -> parseFanuc(modelFamily.uppercase(), text)
            "SIEMENS" -> parseSiemens(modelFamily.uppercase(), text)
            "MITSUBISHI" -> parseMitsubishi(modelFamily.uppercase(), text)
            else -> null
        }
    }

    private fun parseFanuc(model: String, text: String): ParsedAlarm? {
        val patterns = mutableListOf(
            Regex("""\b(PS|SV|SP|OT|OH|DS|PW|SW|SR|BG)\s*[-:/]?\s*([0-9]{3,4})\b"""),
            Regex("""P/S\s*([0-9]{3,4})"""),
            Regex("""SERVO\s*([0-9]{3,4})"""),
            Regex("""ALARM\s*([0-9]{3,4})"""),
            Regex("""\b([0-9]{3,4})\b""")
        )
        if (model.contains("31I")) {
            patterns.add(1, Regex("""APC\s*([0-9]{3,4})"""))
        }
        for (regex in patterns) {
            val m = regex.find(text) ?: continue
            val code = when {
                regex.pattern.startsWith("\\b(PS|SV|SP|OT|OH|DS|PW|SW|SR|BG)") -> {
                    val prefix = m.groupValues[1]
                    val digits = m.groupValues[2].padStart(4, '0')
                    "$prefix$digits"
                }
                regex.pattern.startsWith("P/S") -> "PS${m.groupValues[1].padStart(4, '0')}"
                regex.pattern.startsWith("APC") -> "DS${m.groupValues[1].padStart(4, '0')}"
                regex.pattern.startsWith("SERVO") -> "SV${m.groupValues[1].padStart(4, '0')}"
                else -> m.groupValues[1].padStart(4, '0')
            }
            return ParsedAlarm(code = code, matchedPattern = regex.pattern)
        }
        return null
    }

    private fun parseSiemens(model: String, text: String): ParsedAlarm? {
        val patterns = mutableListOf(
            Regex("""ALARM\s*([0-9]{5,6})"""),
            Regex("""\b([0-9]{5,6})\b""")
        )
        if (model.contains("840D")) {
            patterns.add(0, Regex("""NCK\s*([0-9]{5,6})"""))
        }
        for (regex in patterns) {
            val m = regex.find(text) ?: continue
            return ParsedAlarm(code = m.groupValues[1], matchedPattern = regex.pattern)
        }
        return null
    }

    private fun parseMitsubishi(model: String, text: String): ParsedAlarm? {
        val patterns = mutableListOf(
            Regex("""P\s*([0-9]{3})"""),
            Regex("""S\s*([0-9]{2,3})"""),
            Regex("""A\s*([0-9]{2,3})""")
        )
        if (model.contains("M80")) {
            patterns.add(0, Regex("""MELDAS.*P\s*([0-9]{3})"""))
        }
        for (regex in patterns) {
            val m = regex.find(text) ?: continue
            val prefix = regex.pattern.first { it == 'P' || it == 'S' || it == 'A' }
            return ParsedAlarm(code = "$prefix${m.groupValues[1]}", matchedPattern = regex.pattern)
        }
        return null
    }
}
