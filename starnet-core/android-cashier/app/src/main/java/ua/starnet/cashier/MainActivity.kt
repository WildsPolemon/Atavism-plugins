package ua.starnet.cashier

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import ua.starnet.cashier.ui.StarNetNavHost
import ua.starnet.cashier.ui.theme.StarNetTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StarNetTheme {
                StarNetNavHost()
            }
        }
    }
}
