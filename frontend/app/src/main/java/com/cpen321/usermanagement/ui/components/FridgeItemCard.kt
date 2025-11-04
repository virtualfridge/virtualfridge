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
    val percentFloat = foodItem.percentLeft / 100f

    val backgroundColor by animateColorAsState(
        targetValue = getBackgroundColor(foodItem.percentLeft, percentFloat),
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
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth()) {
            FillBar(foodItem.percentLeft)
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .alpha(contentAlpha)
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                FridgeItemHeader(foodItem, foodType, foodEmoji, isUpdating)
                foodItem.expirationDate?.let { date ->
                    Text(
                        text = "Expires: ${formatDate(date)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (showSlider) {
                    QuantitySlider(
                        sliderValue = sliderValue,
                        onValueChange = { sliderValue = it },
                        onValueChangeFinished = {
                            onPercentChanged(sliderValue.toInt())
                            showSlider = false
                        }
                    )
                }
                ActionButtons(
                    showSlider = showSlider,
                    onToggleSlider = { showSlider = !showSlider },
                    onRemove = onRemove,
                    onShowNutrition = { showNutrition = true },
                    percentLeft = foodItem.percentLeft
                )
            }
        }
    }

    if (showNutrition) {
        if (foodType.nutrients != null) {
            NutritionalFactsDialog(
                foodName = foodType.name ?: "Unknown Item",
                nutrients = foodType.nutrients,
                onDismiss = { showNutrition = false }
            )
        } else {
            NoNutritionDataDialog(onDismiss = { showNutrition = false })
        }
    }
}

@Composable
private fun getBackgroundColor(percentLeft: Int, percentFloat: Float): Color {
    return when {
        percentLeft == 0 -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        percentLeft <= 20 -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f + percentFloat * 0.6f)
        percentLeft <= 50 -> MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.4f + percentFloat * 0.6f)
        else -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f + percentFloat * 0.5f)
    }
}

@Composable
private fun FillBar(percentLeft: Int) {
    val fillBarColor by animateColorAsState(
        targetValue = when {
            percentLeft == 0 -> MaterialTheme.colorScheme.surfaceVariant
            percentLeft <= 20 -> MaterialTheme.colorScheme.error
            percentLeft <= 50 -> MaterialTheme.colorScheme.tertiary
            else -> MaterialTheme.colorScheme.primary
        },
        animationSpec = tween(durationMillis = 800),
        label = "fillBarColor"
    )

    val fillHeight by animateFloatAsState(
        targetValue = percentLeft / 100f,
        animationSpec = tween(durationMillis = 800),
        label = "fillHeight"
    )

    Box(
        modifier = Modifier
            .width(6.dp)
            .height(140.dp)
    ) {
        Box(
            modifier = Modifier
                .width(6.dp)
                .fillMaxWidth()
                .height((140 * fillHeight).dp)
                .background(fillBarColor)
                .align(Alignment.BottomStart)
        )
    }
}

@Composable
private fun FridgeItemHeader(
    foodItem: com.cpen321.usermanagement.data.remote.dto.FoodItem,
    foodType: com.cpen321.usermanagement.data.remote.dto.FoodType,
    foodEmoji: String,
    isUpdating: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        FoodEmoji(foodItem, foodEmoji)
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
        PercentageIndicator(isUpdating, foodItem.percentLeft)
    }
}

@Composable
private fun FoodEmoji(foodItem: com.cpen321.usermanagement.data.remote.dto.FoodItem, foodEmoji: String) {
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
}

@Composable
private fun PercentageIndicator(isUpdating: Boolean, percentLeft: Int) {
    Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        if (isUpdating) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp
            )
        } else if (percentLeft == 0) {
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
                text = "$percentLeft%",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = when {
                    percentLeft <= 20 -> MaterialTheme.colorScheme.error
                    percentLeft <= 50 -> MaterialTheme.colorScheme.tertiary
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

@Composable
private fun QuantitySlider(
    sliderValue: Float,
    onValueChange: (Float) -> Unit,
    onValueChangeFinished: () -> Unit
) {
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
                onValueChange = onValueChange,
                onValueChangeFinished = onValueChangeFinished,
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

@Composable
private fun ActionButtons(
    showSlider: Boolean,
    onToggleSlider: () -> Unit,
    onRemove: () -> Unit,
    onShowNutrition: () -> Unit,
    percentLeft: Int
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            EditButton(showSlider, onToggleSlider, Modifier.weight(1f))
            if (percentLeft > 0) {
                RemoveButton(onRemove, Modifier.weight(1f))
            }
        }
        NutritionButton(onShowNutrition, Modifier.fillMaxWidth())
    }
}

@Composable
private fun EditButton(showSlider: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = if (showSlider) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.primaryContainer,
            contentColor = if (showSlider) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onPrimaryContainer
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp, pressedElevation = 4.dp)
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = if (showSlider) "✕" else "✎", fontSize = 16.sp)
            Text(
                text = if (showSlider) "Cancel" else "Edit",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun RemoveButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.errorContainer,
            contentColor = MaterialTheme.colorScheme.onErrorContainer
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp, pressedElevation = 4.dp)
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "🗑", fontSize = 16.sp)
            Text(
                text = "Remove",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun NutritionButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer,
            contentColor = MaterialTheme.colorScheme.onTertiaryContainer
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp, pressedElevation = 4.dp)
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "📊", fontSize = 16.sp)
            Text(
                text = "Nutritional Facts",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun NoNutritionDataDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "📊 Nutritional Facts",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        },
        text = { NoNutritionalData() },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        },
        shape = RoundedCornerShape(16.dp)
    )
}

private fun formatDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: java.text.ParseException) {
        dateString // Return original string if parsing fails
    }
}

private val foodEmojiMap = mapOf(
    // Sweets & Spreads
    "nutella" to "🍫", "hazelnut" to "🍫", "chocolate" to "🍫", "candy" to "🍬", "sweet" to "🍬",
    "honey" to "🍯", "jam" to "🍓", "jelly" to "🍓", "peanut butter" to "🥜",
    // Fruits
    "apple" to "🍎", "banana" to "🍌", "orange" to "🍊", "grape" to "🍇", "strawberry" to "🍓",
    "watermelon" to "🍉", "lemon" to "🍋", "cherry" to "🍒", "peach" to "🍑", "mango" to "🥭",
    "pineapple" to "🍍", "kiwi" to "🥝", "avocado" to "🥑", "berry" to "🫐", "berries" to "🫐",
    // Vegetables
    "tomato" to "🍅", "carrot" to "🥕", "broccoli" to "🥦", "lettuce" to "🥬", "salad" to "🥬",
    "cucumber" to "🥒", "pepper" to "🫑", "bell" to "🫑", "corn" to "🌽", "potato" to "🥔",
    "onion" to "🧅", "garlic" to "🧄", "mushroom" to "🍄", "eggplant" to "🍆",
    // Dairy
    "milk" to "🥛", "cheese" to "🧀", "yogurt" to "🥛", "yoghurt" to "🥛", "butter" to "🧈",
    "cream" to "🥛", "ice cream" to "🍦", "icecream" to "🍦",
    // Protein
    "egg" to "🥚", "chicken" to "🍗", "beef" to "🥩", "steak" to "🥩", "pork" to "🥓",
    "bacon" to "🥓", "fish" to "🐟", "salmon" to "🐟", "tuna" to "🐟", "shrimp" to "🦐",
    "prawn" to "🦐",
    // Bread & Grains
    "bread" to "🍞", "bagel" to "🥯", "croissant" to "🥐", "rice" to "🍚", "pasta" to "🍝",
    "spaghetti" to "🍝", "noodle" to "🍜", "pizza" to "🍕", "taco" to "🌮", "burrito" to "🌯",
    "sandwich" to "🥪", "hot dog" to "🌭", "hotdog" to "🌭", "hamburger" to "🍔", "burger" to "🍔",
    // Beverages
    "coffee" to "☕", "tea" to "🍵", "juice" to "🧃", "water" to "💧", "soda" to "🥤",
    "cola" to "🥤", "beer" to "🍺", "wine" to "🍷",
    // Snacks
    "cookie" to "🍪", "biscuit" to "🍪", "cake" to "🍰", "donut" to "🍩", "doughnut" to "🍩",
    "pretzel" to "🥨", "popcorn" to "🍿", "chips" to "🥔", "crisp" to "🥔", "fries" to "🍟",
    // Meals & Prepared Foods
    "soup" to "🍲", "stew" to "🍲", "curry" to "🍛", "sushi" to "🍱",
    // Condiments & Sauces
    "ketchup" to "🍅", "mustard" to "🌭", "mayo" to "🥪", "mayonnaise" to "🥪", "sauce" to "🥫",
    "oil" to "🫗",
    // Canned & Packaged
    "can" to "🥫", "canned" to "🥫", "jar" to "🫙"
)

private fun getFoodEmoji(foodName: String): String {
    val name = foodName.lowercase()
    return foodEmojiMap.entries.find { (key, _) -> name.contains(key) }?.value ?: "🍽️"
}

@Composable
private fun NutritionalFactsDialog(
    foodName: String,
    nutrients: Nutrients,
    onDismiss: () -> Unit
) {
    val allNutrients = remember(nutrients) { getNutrientList(nutrients) }

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
                NoNutritionalData()
            } else {
                NutrientList(allNutrients)
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
private fun NoNutritionalData() {
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
}

@Composable
private fun NutrientList(allNutrients: List<Pair<String, String>>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        allNutrients.forEach { (name, value) ->
            NutritionItem(name = name, value = value)
        }
    }
}

private fun getNutrientList(nutrients: Nutrients): List<Pair<String, String>> {
    return listOf(
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
    ).mapNotNull { (name, value) ->
        if (value != null && value.isNotBlank()) {
            name to value
        } else {
            null
        }
    }
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
