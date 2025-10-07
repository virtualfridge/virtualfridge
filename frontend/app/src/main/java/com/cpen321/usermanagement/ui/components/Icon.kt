import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import com.cpen321.usermanagement.ui.theme.LocalSpacing

@Composable
fun Icon(
    type: String = "dark",
    name: Int
) {
    val spacing = LocalSpacing.current
    val color = if (type == "dark") {
        Color.Black
    } else {
        Color.White
    }

    Icon(
        painter = painterResource(name),
        contentDescription = null,
        modifier = Modifier.size(spacing.large),
        tint = color
    )
}