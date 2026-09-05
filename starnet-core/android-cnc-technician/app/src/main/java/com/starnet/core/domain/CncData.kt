package com.starnet.core.domain

data class AlarmKnowledge(
    val code: String,
    val controller: String,
    val description: String,
    val causes: List<String>,
    val checks: List<String>
)

data class ThreadReference(
    val family: String,
    val designation: String,
    val pitch: String,
    val majorDia: String,
    val minorDia: String,
    val tapDrill: String
)

val threadReferences = listOf(
    ThreadReference("Metric", "M6 x 1.0", "1.0", "6.0", "4.77", "5.0"),
    ThreadReference("Metric", "M8 x 1.25", "1.25", "8.0", "6.47", "6.8"),
    ThreadReference("Metric", "M10 x 1.5", "1.5", "10.0", "8.16", "8.5"),
    ThreadReference("Metric", "M12 x 1.75", "1.75", "12.0", "9.85", "10.2"),
    ThreadReference("Pipe", "G 1/4", "19 TPI", "13.16", "11.45", "11.8"),
    ThreadReference("Inch", "1/2-13 UNC", "13 TPI", "12.70", "10.16", "10.7")
)
