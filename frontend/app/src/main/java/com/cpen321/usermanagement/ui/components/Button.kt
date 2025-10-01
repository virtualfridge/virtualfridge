import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.cpen321.usermanagement.ui.theme.LocalSpacing

@Composable
fun Button(
    type: String = "primary",
    fullWidth: Boolean = true,
    enabled: Boolean = true,
    onClick: () -> Unit,
    content: @Composable RowScope.() -> Unit,
) {
    val spacing = LocalSpacing.current

    var colors = ButtonDefaults.buttonColors()
    if (type == "secondary") {
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.secondary,
            contentColor = Color.Black
        )
    }

    var modifier = Modifier.height(spacing.extraLarge2)
    if (fullWidth) {
        modifier = modifier.fillMaxWidth()
    }

    Button(
        colors = colors,
        onClick = onClick,
        enabled = enabled,
        modifier = modifier,
    ) {
        content()
    }
}