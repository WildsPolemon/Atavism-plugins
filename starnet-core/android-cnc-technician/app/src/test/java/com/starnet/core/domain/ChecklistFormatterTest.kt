package com.starnet.core.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class ChecklistFormatterTest {
    @Test
    fun `builds structured checklist title from section machine plan`() {
        val result = ChecklistFormatter.composeTitle("Дільниця 2", "SL2000", "План роботи", "")
        assertEquals("Дільниця 2 - SL2000 - План роботи", result)
    }

    @Test
    fun `falls back to free text when structured fields are empty`() {
        val result = ChecklistFormatter.composeTitle("", "", "", "Перевірити патрон")
        assertEquals("Перевірити патрон", result)
    }
}
