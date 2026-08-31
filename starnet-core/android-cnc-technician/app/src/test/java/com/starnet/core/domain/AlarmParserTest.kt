package com.starnet.core.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class AlarmParserTest {
    @Test
    fun `parses fanuc prefixed alarm from ocr text`() {
        val parsed = AlarmParser.parse("FANUC", "0I-TF", "screen shows SV 401 alarm")
        assertNotNull(parsed)
        assertEquals("SV0401", parsed?.code)
    }

    @Test
    fun `parses fanuc legacy p slash s format`() {
        val parsed = AlarmParser.parse("FANUC", "31I", "P/S 10 parameter write")
        assertNotNull(parsed)
        assertEquals("PS0010", parsed?.code)
    }

    @Test
    fun `parses siemens alarm code`() {
        val parsed = AlarmParser.parse("SIEMENS", "840D", "NCK 26020 axis fault")
        assertNotNull(parsed)
        assertEquals("26020", parsed?.code)
    }

    @Test
    fun `does not parse plain numbers without alarm context`() {
        val parsed = AlarmParser.parse("FANUC", "0I-TF", "PARTS COUNT 321 MDI PROGRAM")
        assertNull(parsed)
    }
}
