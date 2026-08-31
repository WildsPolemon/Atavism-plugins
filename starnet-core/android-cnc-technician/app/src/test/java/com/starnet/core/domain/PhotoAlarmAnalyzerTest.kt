package com.starnet.core.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PhotoAlarmAnalyzerTest {
    @Test
    fun `classifies fanuc alarm screen as cnc alarm`() {
        val ocr = "FANUC 0i-TF\nSERVO ALARM\nSV 401\nAXIS X"
        val result = PhotoAlarmAnalyzer.assess(
            ocrText = ocr,
            labels = mapOf("monitor" to 0.9f),
            controller = "FANUC",
            modelFamily = "0I-TF"
        )
        assertEquals(PhotoAssessmentType.CNC_ALARM_SCREEN, result.type)
        assertTrue(result.hasAlarm)
        assertTrue(result.relevantLines.isNotEmpty())
    }

    @Test
    fun `classifies normal cnc runtime screen as no alarm`() {
        val ocr = "PARTS COUNT\nCYCLE TIME\nG54\nMDI\nPROGRAM\nABSOLUTE RELATIVE"
        val result = PhotoAlarmAnalyzer.assess(
            ocrText = ocr,
            labels = mapOf("display" to 0.7f),
            controller = "FANUC",
            modelFamily = "0I-TF"
        )
        assertEquals(PhotoAssessmentType.CNC_SCREEN_NO_ALARM, result.type)
        assertFalse(result.hasAlarm)
    }

    @Test
    fun `classifies random photo text as non cnc`() {
        val ocr = "holiday beach sunset family photo"
        val result = PhotoAlarmAnalyzer.assess(
            ocrText = ocr,
            labels = mapOf("person" to 0.9f, "outdoor" to 0.8f),
            controller = "FANUC",
            modelFamily = "0I-TF"
        )
        assertEquals(PhotoAssessmentType.NON_CNC_OR_UNCLEAR, result.type)
        assertFalse(result.hasAlarm)
    }
}
