package com.starnet.core.domain

object ChecklistFormatter {
    fun composeTitle(section: String, machine: String, plan: String, fallback: String): String {
        val sectionPart = section.trim()
        val machinePart = machine.trim()
        val planPart = plan.trim()
        val fallbackPart = fallback.trim()

        val structured = listOf(sectionPart, machinePart, planPart).filter { it.isNotBlank() }
        if (structured.isNotEmpty()) return structured.joinToString(" - ")
        return fallbackPart
    }
}
