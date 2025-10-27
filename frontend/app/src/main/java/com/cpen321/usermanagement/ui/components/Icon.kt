import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import com.cpen321.usermanagement.ui.theme.LocalSpacing

@Composable
fun Icon(
    type: String = "dark",
    name: Int,
    fixedColor: Color? = null
) {
    val spacing = LocalSpacing.current
    // Use fixed color if provided, otherwise use theme-aware colors
    val color = fixedColor ?: if (type == "dark") {
        MaterialTheme.colorScheme.onSurface
    } else {
        MaterialTheme.colorScheme.surface
    }

    Icon(
        painter = painterResource(name),
        contentDescription = null,
        modifier = Modifier.size(spacing.large),
        tint = color
    )
}