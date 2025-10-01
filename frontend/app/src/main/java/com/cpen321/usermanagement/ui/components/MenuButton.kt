import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.ui.theme.LocalSpacing

@Composable
fun MenuButton(
    enabled: Boolean = true,
    onClick: () -> Unit,
    content: @Composable RowScope.() -> Unit,
) {
    val spacing = LocalSpacing.current

    val colors = ButtonDefaults.buttonColors(
        containerColor = Color.White,
        contentColor = Color.Black,
    )

    val border = BorderStroke(1.dp, Color.LightGray)

    OutlinedButton(
        colors = colors,
        border = border,
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(spacing.extraLarge2),
    ) {
        content()
    }
}

@Composable
fun MenuButtonItem(
    text: String,
    iconRes: Int,
    onClick: () -> Unit,
) {
    val spacing = LocalSpacing.current

    MenuButton(
        enabled = true,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                name = iconRes,
            )
            Text(
                text = text,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(start = spacing.medium)
            )
        }
    }
}