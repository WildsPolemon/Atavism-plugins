package com.starnet.core

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.starnet.core.ui.StarnetCoreRoot
import com.starnet.core.ui.theme.StarnetCoreTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StarnetCoreTheme {
                StarnetCoreRoot()
            }
        }
    }
}
