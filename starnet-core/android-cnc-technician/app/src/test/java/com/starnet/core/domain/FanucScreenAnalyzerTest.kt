package com.starnet.core.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FanucScreenAnalyzerTest {
    @Test
    fun `detects model type and code from fanuc ocr text`() {
        val ocr = "FANUC SERIES 0i-TF\\nSV 401 SERVO ALARM\\nAXIS X"
        val result = FanucScreenAnalyzer.detect(ocr)

        assertEquals("0I-TF", result.modelFamily)
        assertEquals("SERVO", result.alarmType)
        assertEquals("SV401", result.rawCode)
        assertTrue(result.confidence >= 0.9f)
        assertTrue(result.candidateCodes.isNotEmpty())
    }

    @Test
    fun `returns numeric candidates when prefix is missing`() {
        val ocr = "FANUC 31i MODEL B\\nALARM 411\\nSERVO ERROR"
        val result = FanucScreenAnalyzer.detect(ocr)
        assertEquals("31I", result.modelFamily)
        assertEquals("SERVO", result.alarmType)
        assertEquals("411", result.rawCode)
        assertTrue(result.candidateCodes.contains("411"))
    }
}
