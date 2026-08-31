package com.starnet.core.domain

enum class PhotoAssessmentType {
    CNC_ALARM_SCREEN,
    CNC_SCREEN_NO_ALARM,
    NON_CNC_OR_UNCLEAR
}

data class PhotoAssessment(
    val type: PhotoAssessmentType,
    val summary: String,
    val relevantLines: List<String>,
    val hasAlarm: Boolean
)

object PhotoAlarmAnalyzer {
    fun assess(
        ocrText: String,
        labels: Map<String, Float>,
        controller: String,
        modelFamily: String
    ): PhotoAssessment {
        val upper = ocrText.uppercase()
        val alarmContext = Regex("""\b(ALARM|ALM|ERROR|ERR|FAULT|WARNING|SERVO|SPINDLE|P/S|PMC|APC)\b""")
            .containsMatchIn(upper)
        val parserMatch = AlarmParser.parse(controller, modelFamily, upper)
        val fanucDetection = if (controller.uppercase() == "FANUC") FanucScreenAnalyzer.detect(upper) else null
        val hasAlarm = alarmContext && (parserMatch != null || fanucDetection?.rawCode != null)

        val cncScore = buildCncScore(upper, labels)
        val relevant = extractRelevantLines(ocrText, hasAlarm)

        return when {
            cncScore >= 2.5f && hasAlarm -> PhotoAssessment(
                type = PhotoAssessmentType.CNC_ALARM_SCREEN,
                summary = "CNC alarm screen detected. Alarm context found.",
                relevantLines = relevant,
                hasAlarm = true
            )

            cncScore >= 2.5f -> PhotoAssessment(
                type = PhotoAssessmentType.CNC_SCREEN_NO_ALARM,
                summary = "CNC screen detected. No alarm text found on this photo.",
                relevantLines = relevant,
                hasAlarm = false
            )

            else -> PhotoAssessment(
                type = PhotoAssessmentType.NON_CNC_OR_UNCLEAR,
                summary = "No clear CNC alarm screen detected. Use a sharper CNC screen photo for diagnostics.",
                relevantLines = relevant,
                hasAlarm = false
            )
        }
    }

    private fun buildCncScore(text: String, labels: Map<String, Float>): Float {
        var score = 0f
        if (Regex("""\b(FANUC|SIEMENS|MITSUBISHI|CNC)\b""").containsMatchIn(text)) score += 1.0f
        if (Regex("""\b(G0[0-3]|G5[4-9]|M30|MDI|AUTO|HANDLE|PROGRAM|RUN\s*TIME|ABSOLUTE|RELATIVE|PARTS)\b""").containsMatchIn(text)) score += 1.8f
        if (Regex("""\b(AXIS|TOOL|OFFSET|WORK|CYCLE)\b""").containsMatchIn(text)) score += 0.7f

        labels.forEach { (label, confidence) ->
            when {
                label.contains("machine") || label.contains("monitor") || label.contains("display") -> score += confidence
                label.contains("screen") || label.contains("electronic") -> score += confidence * 0.6f
            }
        }
        return score
    }

    private fun extractRelevantLines(raw: String, hasAlarm: Boolean): List<String> {
        val lines = raw
            .replace("\r", "\n")
            .lines()
            .map { it.trim().replace("""\s+""".toRegex(), " ") }
            .filter { it.isNotBlank() }

        val keywords = if (hasAlarm) {
            Regex("""(?i)(ALARM|ERROR|FAULT|SERVO|SPINDLE|P/S|PMC|APC|PS\s*\d+|SV\s*\d+|SP\s*\d+|OT\s*\d+|OH\s*\d+|DS\s*\d+)""")
        } else {
            Regex("""(?i)(FANUC|SIEMENS|MITSUBISHI|CNC|MDI|AUTO|HANDLE|PROGRAM|RUN\s*TIME|G5[4-9]|ABSOLUTE|RELATIVE|PARTS|CYCLE)""")
        }

        val filtered = lines.filter { keywords.containsMatchIn(it) }.take(6)
        if (filtered.isNotEmpty()) return filtered
        return lines.take(4)
    }
}
