package com.cpen321.usermanagement.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FridgeItemCard(
    fridgeItem: FridgeItem,
    isUpdating: Boolean,
    onPercentChanged: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val foodItem = fridgeItem.foodItem
    val foodType = fridgeItem.foodType
    
    var sliderValue by remember { mutableFloatStateOf(foodItem.percentLeft.toFloat()) }
    var showSlider by remember { mutableStateOf(false) }

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header row with name and percentage
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = foodType.name ?: "Unknown Item",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    foodType.brand?.let { brand ->
                        Text(
                            text = brand,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (isUpdating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                    }
                    
                    Text(
                        text = "${foodItem.percentLeft}%",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (foodItem.percentLeft <= 20) {
                            MaterialTheme.colorScheme.error
                        } else if (foodItem.percentLeft <= 50) {
                            MaterialTheme.colorScheme.tertiary
                        } else {
                            MaterialTheme.colorScheme.primary
                        }
                    )
                }
            }

            // Expiration date
            foodItem.expirationDate?.let { date ->
                Text(
                    text = "Expires: ${formatDate(date)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Quantity slider
            if (showSlider) {
                Column {
                    Text(
                        text = "Adjust Quantity",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium
                    )
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "0%",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.width(32.dp),
                            textAlign = TextAlign.Center
                        )
                        
                        Slider(
                            value = sliderValue,
                            onValueChange = { newValue ->
                                sliderValue = newValue
                            },
                            onValueChangeFinished = {
                                val newPercent = sliderValue.toInt()
                                onPercentChanged(newPercent)
                                showSlider = false
                            },
                            valueRange = 0f..100f,
                            modifier = Modifier.weight(1f)
                        )
                        
                        Text(
                            text = "100%",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.width(32.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(
                    onClick = { showSlider = !showSlider },
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = if (showSlider) "Cancel" else "Edit",
                        style = MaterialTheme.typography.labelMedium
                    )
                }
                
                if (foodItem.percentLeft > 0) {
                    IconButton(
                        onClick = { onPercentChanged(0) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "Remove",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

private fun formatDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        dateString // Return original string if parsing fails
    }
}
