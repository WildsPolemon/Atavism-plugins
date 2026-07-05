package ua.starnet.cashier.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val StarColors = lightColorScheme(
    primary = StarBlue,
    onPrimary = StarSurface,
    primaryContainer = StarBlueLight,
    onPrimaryContainer = StarBlueDark,
    secondary = StarOrange,
    onSecondary = StarSurface,
    background = StarBg,
    onBackground = StarText,
    surface = StarSurface,
    onSurface = StarText,
    surfaceVariant = StarBlueLight,
    outline = StarBorder,
    error = StarRed,
)

private val StarTypography = Typography(
    headlineLarge = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.Bold, color = StarText),
    headlineMedium = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, color = StarText),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = StarText),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = StarText),
    bodyLarge = TextStyle(fontSize = 16.sp, color = StarText),
    bodyMedium = TextStyle(fontSize = 14.sp, color = StarText),
    bodySmall = TextStyle(fontSize = 12.sp, color = StarMuted),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Bold, color = StarBlue),
)

private val StarShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
)

@Composable
fun StarNetTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = StarColors,
        typography = StarTypography,
        shapes = StarShapes,
        content = content,
    )
}

fun fmtUah(n: Double) = String.format(java.util.Locale("uk", "UA"), "%.2f ₴", n)
