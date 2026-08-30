package com.starnet.core.domain

import com.starnet.core.data.AlarmCodeEntity
import com.google.gson.Gson

object FanucAlarmCatalog {
    fun build(revision: Int, gson: Gson): List<AlarmCodeEntity> {
        val rows = mutableListOf<AlarmCodeEntity>()

        fun add(
            code: String,
            title: String,
            severity: String,
            causes: List<String>,
            actions: List<String>,
            modelFamily: String = "GENERIC"
        ) {
            rows += AlarmCodeEntity(
                key = "FANUC|$modelFamily|${code.uppercase()}",
                controller = "FANUC",
                modelFamily = modelFamily,
                code = code.uppercase(),
                title = title,
                severity = severity,
                causesJson = gson.toJson(causes),
                actionsJson = gson.toJson(actions),
                revision = revision
            )
        }

        // Core P/S alarms often used on turning centers.
        val psBase = listOf(
            "0000" to "Power cycle required after parameter change",
            "0001" to "Reference return needed",
            "0003" to "Improper G-code",
            "0010" to "Improper command format",
            "0020" to "Over tolerance command",
            "0022" to "No axis command in interpolation",
            "0023" to "Illegal radius command",
            "0025" to "Circle cut in rapid mode",
            "0028" to "Illegal plane select",
            "0030" to "Illegal offset number",
            "0031" to "Illegal P command in G10",
            "0034" to "No circular move allowed in startup/extension block",
            "0085" to "Serial communication alarm",
            "0100" to "Parameter write enable is ON",
            "0101" to "Memory clear required",
            "0110" to "Program not found",
            "0111" to "Program number duplicated",
            "0149" to "No option for commanded function"
        )
        psBase.forEach { (code, title) ->
            add(
                code = "PS$code",
                title = title,
                severity = "high",
                causes = listOf("NC program mismatch", "Incorrect setting/parameter", "Unsupported command"),
                actions = listOf("Check alarm line in program", "Verify control option availability", "Reset after correcting data"),
                modelFamily = "0I-TF"
            )
            add(
                code = "PS$code",
                title = title,
                severity = "high",
                causes = listOf("NC program mismatch", "Incorrect setting/parameter", "Unsupported command"),
                actions = listOf("Check alarm line in program", "Verify control option availability", "Reset after correcting data"),
                modelFamily = "31I"
            )
        }

        fun range(prefix: String, from: Int, to: Int, title: String, severity: String) {
            for (n in from..to) {
                val code = "$prefix${n.toString().padStart(4, '0')}"
                add(
                    code = code,
                    title = "$title ($code family)",
                    severity = severity,
                    causes = listOf("Hardware/parameter issue in $prefix family", "Controller configuration mismatch"),
                    actions = listOf("Open diagnostics page and capture detail bits", "Check cabinet modules and machine interlocks", "Use service manual for family-specific subcode"),
                    modelFamily = "0I-TF"
                )
                add(
                    code = code,
                    title = "$title ($code family)",
                    severity = severity,
                    causes = listOf("Hardware/parameter issue in $prefix family", "Controller configuration mismatch"),
                    actions = listOf("Open diagnostics page and capture detail bits", "Check cabinet modules and machine interlocks", "Use service manual for family-specific subcode"),
                    modelFamily = "31I"
                )
            }
        }

        // Servo families observed in public references and maintenance excerpts.
        range("SV", 1, 18, "Servo synchronization/power state alarm", "critical")
        range("SV", 301, 307, "Absolute pulse coder communication alarm", "critical")
        range("SV", 365, 369, "Built-in pulse coder alarm", "critical")
        range("SV", 380, 386, "Separate detector alarm", "critical")
        range("SV", 401, 417, "Servo amplifier/following error alarm", "critical")
        range("SV", 420, 423, "Synchronization torque alarm", "high")
        range("SV", 430, 449, "Servo thermal/current/disconnect alarm", "critical")
        range("SV", 453, 466, "Pulse coder/FSSB/amplifier match alarm", "critical")
        range("SV", 474, 490, "Safety/follow-up/self test alarm", "critical")
        range("SV", 600, 607, "Converter/amplifier power alarm", "critical")
        range("SV", 1025, 1026, "Servo ready/axis arrangement alarm", "high")
        range("SV", 1070, 1079, "Servo limit/consistency alarm", "high")
        range("SV", 5134, 5139, "Advanced servo software alarm", "high")
        range("SV", 5197, 5197, "Servo option data alarm", "high")
        range("SV", 5311, 5311, "Servo safety consistency alarm", "high")

        // Overtravel and overheat.
        range("OT", 500, 511, "Overtravel alarm", "critical")
        range("OH", 700, 704, "Overheat alarm", "high")

        // Power/parameter alarms.
        range("PW", 0, 18, "Power cycle and PMC assignment alarm", "high")
        range("SW", 100, 100, "Parameter write enable warning", "medium")

        // DS family from 0i/31i references.
        range("DS", 1, 22, "Malfunction prevention / execution alarm", "high")
        range("DS", 50, 59, "Execution resource alarm", "medium")
        range("DS", 131, 133, "Reference frame alarm", "high")
        range("DS", 300, 310, "APC/reference return alarm", "high")
        range("DS", 405, 405, "Zero return endpoint alarm", "high")
        range("DS", 608, 608, "Servo/power fan alarm", "high")
        range("DS", 1150, 1150, "A/D converter alarm", "high")
        range("DS", 1448, 1450, "Reference/position chain alarm", "high")
        range("DS", 1931, 1933, "Machine parameter consistency alarm", "high")
        range("DS", 5340, 5340, "Parameter checksum alarm", "critical")
        range("DS", 5550, 5550, "Immediate stop alarm", "critical")

        // Spindle and rigid tapping.
        range("SP", 740, 742, "Rigid tapping spindle alarm", "critical")
        range("SP", 752, 757, "Spindle mode/torque/safety alarm", "high")
        range("SP", 1202, 1247, "Serial spindle communication and coder alarm", "critical")
        range("SP", 1700, 1700, "Spindle safety parameter alarm", "high")
        range("SP", 1969, 1999, "Spindle control software/parameter alarm", "critical")
        range("SP", 9001, 9041, "Spindle amplifier alarm", "critical")

        return rows
    }
}
