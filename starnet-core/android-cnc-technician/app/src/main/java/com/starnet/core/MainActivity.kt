package com.starnet.core

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.starnet.core.ui.StarnetCoreRoot
import com.starnet.core.ui.theme.StarnetCoreTheme
import java.io.File

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // #region agent log
        File("/opt/cursor/logs/debug.log").appendText("""{"hypothesisId":"B","location":"MainActivity.kt:onCreate:entry","message":"MainActivity onCreate entered","data":{"savedInstanceStateNull":${savedInstanceState == null}},"timestamp":${System.currentTimeMillis()}}""" + "\n")
        // #endregion
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        // #region agent log
        File("/opt/cursor/logs/debug.log").appendText("""{"hypothesisId":"C","location":"MainActivity.kt:onCreate:setContent","message":"setContent starting","data":{},"timestamp":${System.currentTimeMillis()}}""" + "\n")
        // #endregion
        setContent {
            StarnetCoreTheme {
                StarnetCoreRoot()
            }
        }
        // #region agent log
        File("/opt/cursor/logs/debug.log").appendText("""{"hypothesisId":"C","location":"MainActivity.kt:onCreate:exit","message":"MainActivity onCreate completed","data":{},"timestamp":${System.currentTimeMillis()}}""" + "\n")
        // #endregion
    }
}
