package com.cpen321.usermanagement.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE9DDFF),
    onPrimaryContainer = Color(0xFF22005D),
    secondary = Color(0xFF625B71),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE8DEF8),
    onSecondaryContainer = Color(0xFF1E192B),
    tertiary = Color(0xFF7E5260),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFD9E3),
    onTertiaryContainer = Color(0xFF31101D),
    background = Color(0xFFFFFBFF),
    onBackground = Color(0xFF1C1B1E),
    surface = Color(0xFFFFFBFF),
    onSurface = Color(0xFF1C1B1E),
    surfaceVariant = Color(0xFFE7E0EB),
    onSurfaceVariant = Color(0xFF49454E),
    outline = Color(0xFF7A757F)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFCFBCFF),
    onPrimary = Color(0xFF381E72),
    primaryContainer = Color(0xFF4F378A),
    onPrimaryContainer = Color(0xFFE9DDFF),
    secondary = Color(0xFFCBC2DB),
    onSecondary = Color(0xFF332D41),
    secondaryContainer = Color(0xFF4A4458),
    onSecondaryContainer = Color(0xFFE8DEF8),
    tertiary = Color(0xFFEFB8C8),
    onTertiary = Color(0xFF4A2532),
    tertiaryContainer = Color(0xFF633B48),
    onTertiaryContainer = Color(0xFFFFD9E3),
    background = Color(0xFF1C1B1E),
    onBackground = Color(0xFFE6E1E6),
    surface = Color(0xFF1C1B1E),
    onSurface = Color(0xFFE6E1E6),
    surfaceVariant = Color(0xFF49454E),
    onSurfaceVariant = Color(0xFFCAC4CF),
    outline = Color(0xFF948F99)
)

data class Spacing(
    val none: Dp = 0.dp,
    val extraSmall: Dp = 4.dp,
    val small: Dp = 8.dp,
    val medium: Dp = 16.dp,
    val large: Dp = 24.dp,
    val extraLarge: Dp = 32.dp,
    val extraLarge2: Dp = 48.dp,
    val extraLarge3: Dp = 64.dp,
    val extraLarge4: Dp = 96.dp,
    val extraLarge5: Dp = 120.dp,
)

data class FontSizes(
    val extraSmall: androidx.compose.ui.unit.TextUnit = 10.sp,
    val small: androidx.compose.ui.unit.TextUnit = 12.sp,
    val medium: androidx.compose.ui.unit.TextUnit = 14.sp,
    val regular: androidx.compose.ui.unit.TextUnit = 16.sp,
    val large: androidx.compose.ui.unit.TextUnit = 18.sp,
    val extraLarge: androidx.compose.ui.unit.TextUnit = 20.sp,
    val extraLarge2: androidx.compose.ui.unit.TextUnit = 24.sp,
    val extraLarge3: androidx.compose.ui.unit.TextUnit = 32.sp,
    val extraLarge4: androidx.compose.ui.unit.TextUnit = 48.sp,
)

val LocalSpacing = staticCompositionLocalOf { Spacing() }
val LocalFontSizes = staticCompositionLocalOf { FontSizes() }

@Composable
fun ProvideSpacing(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalSpacing provides Spacing()) {
        content()
    }
}

@Composable
fun ProvideFontSizes(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalFontSizes provides FontSizes()) {
        content()
    }
}

@Composable
fun UserManagementTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val insetsController = WindowCompat.getInsetsController(window, view)

            WindowCompat.setDecorFitsSystemWindows(window, false)

            insetsController.isAppearanceLightStatusBars = !darkTheme

            if (Build.VERSION.SDK_INT < 35) {
                @Suppress("DEPRECATION")
                window.statusBarColor = android.graphics.Color.TRANSPARENT
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
