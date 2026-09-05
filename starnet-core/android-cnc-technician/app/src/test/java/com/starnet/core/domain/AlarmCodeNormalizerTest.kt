package com.starnet.core.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class AlarmCodeNormalizerTest {
    @Test
    fun `normalizes prefixed fanuc codes with zero-padding`() {
        assertEquals("SV0401", AlarmCodeNormalizer.normalize("FANUC", "sv401"))
        assertEquals("PS0010", AlarmCodeNormalizer.normalize("FANUC", "P/S 10"))
        assertEquals("DS0306", AlarmCodeNormalizer.normalize("FANUC", "APC306"))
    }

    @Test
    fun `normalizes plain numeric code with fanuc type hint`() {
        assertEquals("SV0411", AlarmCodeNormalizer.normalize("FANUC", "411", "SERVO"))
        assertEquals("SP0754", AlarmCodeNormalizer.normalize("FANUC", "754", "SPINDLE"))
        assertEquals("OH0701", AlarmCodeNormalizer.normalize("FANUC", "701", "OVERHEAT"))
    }

    @Test
    fun `leaves non-fanuc codes unchanged except trim-uppercase`() {
        assertEquals("12345", AlarmCodeNormalizer.normalize("SIEMENS", " 12345 "))
    }
}
