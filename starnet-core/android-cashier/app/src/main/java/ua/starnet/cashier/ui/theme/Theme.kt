package ua.starnet.cashier.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Blue = Color(0xFF1E5BB8)
private val Orange = Color(0xFFF97316)

private val LightColors = lightColorScheme(
    primary = Blue,
    secondary = Orange,
)

@Composable
fun StarNetTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightColors, content = content)
}

fun fmtUah(n: Double) = String.format(java.util.Locale("uk", "UA"), "%.2f ₴", n)
