package ua.starnet.cashier.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ua.starnet.cashier.ui.theme.*

@Composable
fun StarGradientBg(modifier: Modifier = Modifier) {
    Box(
        modifier.background(
            Brush.linearGradient(listOf(StarBlue, StarBlueDark, Color(0xFF0F2D5C)))
        )
    )
}

@Composable
fun PosCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(16.dp)
    if (onClick != null) {
        ElevatedCard(
            onClick = onClick,
            modifier = modifier,
            shape = shape,
            colors = CardDefaults.elevatedCardColors(containerColor = StarSurface),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
        ) { Column(Modifier.padding(16.dp), content = content) }
    } else {
        Surface(
            modifier = modifier.border(1.dp, StarBorder, shape),
            shape = shape,
            color = StarSurface,
            tonalElevation = 1.dp,
        ) { Column(Modifier.padding(16.dp), content = content) }
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    color: Color = StarBlue,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = color, disabledContainerColor = StarBorder),
    ) {
        if (loading) CircularProgressIndicator(Modifier.size(22.dp), color = StarSurface, strokeWidth = 2.dp)
        else Text(text, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun OrangeSaleButton(total: String, onClick: () -> Unit, enabled: Boolean, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(56.dp).fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = StarOrange,
            disabledContainerColor = StarBorder,
        ),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("ПРОДАЖ", fontWeight = FontWeight.Bold, fontSize = MaterialTheme.typography.titleMedium.fontSize)
            Text(total, fontWeight = FontWeight.Bold, fontSize = MaterialTheme.typography.titleLarge.fontSize)
        }
    }
}

@Composable
fun SectionTitle(text: String, icon: ImageVector? = null) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
        if (icon != null) {
            Icon(icon, null, tint = StarBlue, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(8.dp))
        }
        Text(text, style = MaterialTheme.typography.titleMedium, color = StarBlue)
    }
}

@Composable
fun InfoBanner(text: String, color: Color = StarBlueLight, textColor: Color = StarBlueDark) {
    Surface(color = color, shape = RoundedCornerShape(10.dp)) {
        Text(text, Modifier.padding(12.dp), style = MaterialTheme.typography.bodySmall, color = textColor)
    }
}

@Composable
fun StatusChip(text: String, color: Color) {
    Surface(color = color.copy(alpha = 0.12f), shape = RoundedCornerShape(20.dp)) {
        Text(text, Modifier.padding(horizontal = 10.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold), color = color)
    }
}

@Composable
fun AvatarCircle(label: String, size: Int = 40) {
    Box(
        Modifier.size(size.dp).clip(CircleShape).background(StarOrange),
        contentAlignment = Alignment.Center,
    ) {
        Text(label.take(1).uppercase(), color = StarSurface, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun LoadingOverlay(visible: Boolean) {
    if (!visible) return
    Box(
        Modifier.fillMaxSize().background(Color.Black.copy(0.35f)),
        contentAlignment = Alignment.Center,
    ) {
        Surface(shape = RoundedCornerShape(16.dp), color = StarSurface) {
            Column(Modifier.padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = StarBlue)
                Spacer(Modifier.height(12.dp))
                Text("Зачекайте...", color = StarMuted)
            }
        }
    }
}
