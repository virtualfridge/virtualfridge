package com.cpen321.usermanagement.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.data.remote.dto.Nutrients
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FridgeItemCard(
    fridgeItem: FridgeItem,
    isUpdating: Boolean,
    onPercentChanged: (Int) -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    val foodItem = fridgeItem.foodItem
    val foodType = fridgeItem.foodType

    var sliderValue by remember { mutableFloatStateOf(foodItem.percentLeft.toFloat()) }
    var showSlider by remember { mutableStateOf(false) }
    var showNutrition by remember { mutableStateOf(false) }

    val foodEmoji = getFoodEmoji(foodType.name ?: "")

    // Calculate background color based on percentage (with animation)
    val percentFloat = foodItem.percentLeft / 100f

    val backgroundColor by animateColorAsState(
        targetValue = when {
            foodItem.percentLeft == 0 -> {
                // Dark/grayed out when empty
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
            }
            foodItem.percentLeft <= 20 -> {
                // Warning state - reddish tint
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f + percentFloat * 0.6f)
            }
            foodItem.percentLeft <= 50 -> {
                // Medium - yellowish/orange tint
                MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.4f + percentFloat * 0.6f)
            }
            else -> {
                // Full - vibrant green/blue tint
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f + percentFloat * 0.5f)
            }
        },
        animationSpec = tween(durationMillis = 800),
        label = "cardBackgroundColor"
    )

    val contentAlpha by animateFloatAsState(
        targetValue = if (foodItem.percentLeft == 0) 0.5f else 1f,
        animationSpec = tween(durationMillis = 800),
        label = "contentAlpha"
    )

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = backgroundColor
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Vertical fill bar on the left
            val fillBarColor by animateColorAsState(
                targetValue = when {
                    foodItem.percentLeft == 0 -> MaterialTheme.colorScheme.surfaceVariant
                    foodItem.percentLeft <= 20 -> MaterialTheme.colorScheme.error
                    foodItem.percentLeft <= 50 -> MaterialTheme.colorScheme.tertiary
                    else -> MaterialTheme.colorScheme.primary
                },
                animationSpec = tween(durationMillis = 800),
                label = "fillBarColor"
            )

            val fillHeight by animateFloatAsState(
                targetValue = foodItem.percentLeft / 100f,
                animationSpec = tween(durationMillis = 800),
                label = "fillHeight"
            )

            Box(
                modifier = Modifier
                    .width(6.dp)
                    .height(140.dp)
            ) {
                // Fill indicator from bottom to top
                Box(
                    modifier = Modifier
                        .width(6.dp)
                        .fillMaxWidth()
                        .height((140 * fillHeight).dp)
                        .background(fillBarColor)
                        .align(Alignment.BottomStart)
                )
            }

            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .alpha(contentAlpha)
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
            // Header row with emoji, name and percentage
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Food emoji in a circular background
                val emojiBackgroundColor by animateColorAsState(
                    targetValue = when {
                        foodItem.percentLeft == 0 -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        foodItem.percentLeft <= 20 -> MaterialTheme.colorScheme.errorContainer
                        foodItem.percentLeft <= 50 -> MaterialTheme.colorScheme.tertiaryContainer
                        else -> MaterialTheme.colorScheme.primaryContainer
                    },
                    animationSpec = tween(durationMillis = 800),
                    label = "emojiBackgroundColor"
                )

                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(emojiBackgroundColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (foodItem.percentLeft == 0) "❌" else foodEmoji,
                        fontSize = 32.sp,
                        textAlign = TextAlign.Center
                    )
                }

                // Name and brand
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = foodType.name ?: "Unknown Item",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    foodType.brand?.let { brand ->
                        Text(
                            text = brand,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Percentage indicator
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (isUpdating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                    } else if (foodItem.percentLeft == 0) {
                        Text(
                            text = "EMPTY",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = "restock soon",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error.copy(alpha = 0.7f)
                        )
                    } else {
                        Text(
                            text = "${foodItem.percentLeft}%",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                foodItem.percentLeft <= 20 -> MaterialTheme.colorScheme.error
                                foodItem.percentLeft <= 50 -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.primary
                            }
                        )
                        Text(
                            text = "remaining",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
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
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Edit/Cancel Button
                    Button(
                        onClick = { showSlider = !showSlider },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (showSlider)
                                MaterialTheme.colorScheme.surfaceVariant
                            else
                                MaterialTheme.colorScheme.primaryContainer,
                            contentColor = if (showSlider)
                                MaterialTheme.colorScheme.onSurfaceVariant
                            else
                                MaterialTheme.colorScheme.onPrimaryContainer
                        ),
                        elevation = ButtonDefaults.buttonElevation(
                            defaultElevation = 2.dp,
                            pressedElevation = 4.dp
                        )
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (showSlider) "✕" else "✎",
                                fontSize = 16.sp
                            )
                            Text(
                                text = if (showSlider) "Cancel" else "Edit",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    if (foodItem.percentLeft > 0) {
                        // Remove Button
                        Button(
                            onClick = { onRemove() },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer,
                                contentColor = MaterialTheme.colorScheme.onErrorContainer
                            ),
                            elevation = ButtonDefaults.buttonElevation(
                                defaultElevation = 2.dp,
                                pressedElevation = 4.dp
                            )
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "🗑",
                                    fontSize = 16.sp
                                )
                                Text(
                                    text = "Remove",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                // Nutritional Facts Button (always show)
                Button(
                    onClick = { showNutrition = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                        contentColor = MaterialTheme.colorScheme.onTertiaryContainer
                    ),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 2.dp,
                        pressedElevation = 4.dp
                    )
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "📊",
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Nutritional Facts",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Nutritional Facts Dialog
            if (showNutrition) {
                if (foodType.nutrients != null) {
                    NutritionalFactsDialog(
                        foodName = foodType.name ?: "Unknown Item",
                        nutrients = foodType.nutrients!!,
                        onDismiss = { showNutrition = false }
                    )
                } else {
                    // Show message when no nutritional data available
                    AlertDialog(
                        onDismissRequest = { showNutrition = false },
                        title = {
                            Text(
                                text = "📊 Nutritional Facts",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        text = {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Text(
                                    text = "❌",
                                    fontSize = 48.sp
                                )
                                Text(
                                    text = "No nutritional information available for this item",
                                    style = MaterialTheme.typography.bodyLarge,
                                    textAlign = TextAlign.Center,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { showNutrition = false }) {
                                Text("Close")
                            }
                        },
                        shape = RoundedCornerShape(16.dp)
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
    } catch (e: ParseException) {
        // Return original string if parsing fails
        dateString
    } catch (e: IllegalArgumentException) {
        dateString // Return original string if parsing fails
    }
}

// refactoring into smaller helpers would be noisier and risks mangling emoji literals
// supressed for that reason
@Suppress("LongMethod", "ComplexMethod")
private fun getFoodEmoji(foodName: String): String {
    val name = foodName.lowercase()

    return when {
        // Sweets & Spreads
        name.contains("nutella") || name.contains("hazelnut") -> "🍫"
        name.contains("chocolate") -> "🍫"
        name.contains("candy") || name.contains("sweet") -> "🍬"
        name.contains("honey") -> "🍯"
        name.contains("jam") || name.contains("jelly") -> "🍓"
        name.contains("peanut butter") -> "🥜"

        // Fruits
        name.contains("apple") -> "🍎"
        name.contains("banana") -> "🍌"
        name.contains("orange") -> "🍊"
        name.contains("grape") -> "🍇"
        name.contains("strawberry") -> "🍓"
        name.contains("watermelon") -> "🍉"
        name.contains("lemon") -> "🍋"
        name.contains("cherry") -> "🍒"
        name.contains("peach") -> "🍑"
        name.contains("mango") -> "🥭"
        name.contains("pineapple") -> "🍍"
        name.contains("kiwi") -> "🥝"
        name.contains("avocado") -> "🥑"
        name.contains("berry") || name.contains("berries") -> "🫐"

        // Vegetables
        name.contains("tomato") -> "🍅"
        name.contains("carrot") -> "🥕"
        name.contains("broccoli") -> "🥦"
        name.contains("lettuce") || name.contains("salad") -> "🥬"
        name.contains("cucumber") -> "🥒"
        name.contains("pepper") || name.contains("bell") -> "🫑"
        name.contains("corn") -> "🌽"
        name.contains("potato") -> "🥔"
        name.contains("onion") -> "🧅"
        name.contains("garlic") -> "🧄"
        name.contains("mushroom") -> "🍄"
        name.contains("eggplant") -> "🍆"

        // Dairy
        name.contains("milk") -> "🥛"
        name.contains("cheese") -> "🧀"
        name.contains("yogurt") || name.contains("yoghurt") -> "🥛"
        name.contains("butter") -> "🧈"
        name.contains("cream") -> "🥛"
        name.contains("ice cream") || name.contains("icecream") -> "🍦"

        // Protein
        name.contains("egg") -> "🥚"
        name.contains("chicken") -> "🍗"
        name.contains("beef") || name.contains("steak") -> "🥩"
        name.contains("pork") || name.contains("bacon") -> "🥓"
        name.contains("fish") || name.contains("salmon") || name.contains("tuna") -> "🐟"
        name.contains("shrimp") || name.contains("prawn") -> "🦐"

        // Bread & Grains
        name.contains("bread") -> "🍞"
        name.contains("bagel") -> "🥯"
        name.contains("croissant") -> "🥐"
        name.contains("rice") -> "🍚"
        name.contains("pasta") || name.contains("spaghetti") -> "🍝"
        name.contains("noodle") -> "🍜"
        name.contains("pizza") -> "🍕"
        name.contains("taco") -> "🌮"
        name.contains("burrito") -> "🌯"
        name.contains("sandwich") -> "🥪"
        name.contains("hot dog") || name.contains("hotdog") -> "🌭"
        name.contains("hamburger") || name.contains("burger") -> "🍔"

        // Beverages
        name.contains("coffee") -> "☕"
        name.contains("tea") -> "🍵"
        name.contains("juice") -> "🧃"
        name.contains("water") -> "💧"
        name.contains("soda") || name.contains("cola") -> "🥤"
        name.contains("beer") -> "🍺"
        name.contains("wine") -> "🍷"

        // Snacks
        name.contains("cookie") || name.contains("biscuit") -> "🍪"
        name.contains("cake") -> "🍰"
        name.contains("donut") || name.contains("doughnut") -> "🍩"
        name.contains("pretzel") -> "🥨"
        name.contains("popcorn") -> "🍿"
        name.contains("chips") || name.contains("crisp") -> "🥔"
        name.contains("fries") -> "🍟"

        // Meals & Prepared Foods
        name.contains("soup") -> "🍲"
        name.contains("stew") -> "🍲"
        name.contains("curry") -> "🍛"
        name.contains("sushi") -> "🍱"
        name.contains("salad") -> "🥗"

        // Condiments & Sauces
        name.contains("ketchup") -> "🍅"
        name.contains("mustard") -> "🌭"
        name.contains("mayo") || name.contains("mayonnaise") -> "🥪"
        name.contains("sauce") -> "🥫"
        name.contains("oil") -> "🫗"

        // Canned & Packaged
        name.contains("can") || name.contains("canned") -> "🥫"
        name.contains("jar") -> "🫙"

        // Default emoji for unknown items
        else -> "🍽️"
    }
}

/*
 * Rationale for suppression:
 * - This dialog lays out static UI for a list of nutrient fields.
 * - Its length comes from Compose UI markup and string literals, not complex logic.
 * - Splitting the content further would add indirection without real readability gains.
 * - Keeping it inline keeps the dialog cohesive and easy to scan.
 */
@Suppress("LongMethod", "ComplexMethod")
@Composable
private fun NutritionalFactsDialog(
    foodName: String,
    nutrients: Nutrients,
    onDismiss: () -> Unit
) {
    // Collect all nutrient data
    val allNutrients = listOf(
        "Calories" to nutrients.calories,
        "Energy (kJ)" to nutrients.energy_kj,
        "Protein" to nutrients.protein,
        "Carbohydrates" to nutrients.carbs,
        "Sugars" to nutrients.sugars,
        "Fiber" to nutrients.fiber,
        "Fat" to nutrients.fat,
        "Saturated Fat" to nutrients.saturated_fat,
        "Monounsaturated Fat" to nutrients.monounsaturated_fat,
        "Polyunsaturated Fat" to nutrients.polyunsaturated_fat,
        "Trans Fat" to nutrients.trans_fat,
        "Cholesterol" to nutrients.cholesterol,
        "Sodium" to nutrients.sodium,
        "Salt" to nutrients.salt,
        "Calcium" to nutrients.calcium,
        "Iron" to nutrients.iron,
        "Magnesium" to nutrients.magnesium,
        "Potassium" to nutrients.potassium,
        "Zinc" to nutrients.zinc,
        "Caffeine" to nutrients.caffeine
    ).filter { it.second != null && it.second!!.isNotBlank() }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "📊 Nutritional Facts",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = foodName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            if (allNutrients.isEmpty()) {
                // Show message when no data
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "❌",
                        fontSize = 48.sp
                    )
                    Text(
                        text = "No nutritional information available",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                // Show all available nutrients
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    allNutrients.forEach { (name, value) ->
                        NutritionItem(name = name, value = value ?: "")
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        },
        shape = RoundedCornerShape(16.dp)
    )
}

@Composable
private fun NutritionSection(
    title: String,
    items: List<Pair<String, String?>>
) {
    val validItems = items.filter { it.second != null && it.second!!.isNotBlank() }

    if (validItems.isNotEmpty()) {
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )

            validItems.forEach { (name, value) ->
                NutritionItem(name = name, value = value ?: "")
            }
        }
    }
}

@Composable
private fun NutritionItem(
    name: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
