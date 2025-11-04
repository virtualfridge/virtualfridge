package com.cpen321.usermanagement.ui.screens

import android.util.Log
import com.cpen321.usermanagement.ui.components.Icon
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.data.remote.dto.Nutrients
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun BarcodeResultScreen(
    mainViewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val uiState by mainViewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            BarcodeResultTopBar(onBackClick = onBackClick)
        }
    ) { paddingValues ->
        BarcodeResultContent(
            paddingValues = paddingValues,
            barcodeResult = uiState.barcodeResult,
            errorMessage = uiState.scanError,
            onRetryScan = { mainViewModel.clearScanError() }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BarcodeResultTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = "Barcode Result",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Medium
            )
        },
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(name = R.drawable.ic_arrow_back)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
private fun BarcodeResultContent(
    paddingValues: PaddingValues,
    barcodeResult: FridgeItem?,
    errorMessage: String?,
    onRetryScan: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = spacing.large, vertical = spacing.medium)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when {
            errorMessage != null -> {
                ErrorContent(
                    errorMessage = errorMessage,
                    onRetryScan = onRetryScan
                )
            }
            barcodeResult != null -> {
                SuccessContent(fridgeItem = barcodeResult)
            }
            else -> {
                Text(
                    text = "No barcode result to display",
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun ErrorContent(
    errorMessage: String,
    onRetryScan: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "❌",
            style = MaterialTheme.typography.displayLarge
        )
        
        Text(
            text = "Scan Failed",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error
        )
        
        Text(
            text = errorMessage,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Button(
            onClick = onRetryScan,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text("Try Again")
        }
    }
}

@Composable
private fun SuccessContent(
    fridgeItem: FridgeItem,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        SuccessHeader()
        ProductInfoCard(fridgeItem = fridgeItem)
        fridgeItem.foodType.nutrients?.let { nutrients ->
            NutritionalInfoCard(nutrients = nutrients)
        }
        fridgeItem.foodType.ingredients?.let { ingredients ->
            IngredientsCard(ingredients = ingredients)
        }
        fridgeItem.foodType.allergens?.let { allergens ->
            if (allergens.isNotEmpty()) {
                AllergensCard(allergens = allergens)
            }
        }
    }
}

@Composable
private fun SuccessHeader() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "✅",
            style = MaterialTheme.typography.displayMedium
        )
        Spacer(modifier = Modifier.size(8.dp))
        Text(
            text = "Product Added Successfully!",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
private fun ProductInfoCard(fridgeItem: FridgeItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Product Information",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            ProductDetailRow(label = "Name", value = fridgeItem.foodType.name)
            ProductDetailRow(label = "Brand", value = fridgeItem.foodType.brand)
            ProductDetailRow(label = "Quantity", value = fridgeItem.foodType.quantity)

            fridgeItem.foodType.shelfLifeDays?.let { days ->
                ProductDetailRow(
                    label = "Shelf Life",
                    value = "$days days"
                )
            }

            fridgeItem.foodItem.expirationDate?.let { date ->
                ProductDetailRow(
                    label = "Your Item Expiration Date",
                    value = formatDate(date)
                )
            }

            fridgeItem.foodType.expiration_date?.let { date ->
                ProductDetailRow(
                    label = "Product Expiration Date",
                    value = date
                )
            }

            ProductDetailRow(
                label = "Quantity Left",
                value = "${fridgeItem.foodItem.percentLeft}%"
            )
        }
    }
}

@Composable
private fun NutritionalInfoCard(nutrients: Nutrients) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Nutritional Information (per 100g)",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            NutrientGrid(nutrients = nutrients)
        }
    }
}

@Composable
private fun IngredientsCard(ingredients: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Ingredients",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            SelectionContainer {
                Text(
                    text = ingredients,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
private fun AllergensCard(allergens: List<String>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "⚠️ Allergens",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onErrorContainer
            )

            SelectionContainer {
                Text(
                    text = allergens.joinToString(", "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    }
}

@Composable
private fun NutrientGrid(
    nutrients: Nutrients,
    modifier: Modifier = Modifier
) {
    val nutrientPairs = listOf(
        "Calories" to nutrients.calories,
        "Energy (kJ)" to nutrients.energy_kj,
        "Protein" to nutrients.protein,
        "Fat" to nutrients.fat,
        "Saturated Fat" to nutrients.saturated_fat,
        "Trans Fat" to nutrients.trans_fat,
        "Monounsaturated Fat" to nutrients.monounsaturated_fat,
        "Polyunsaturated Fat" to nutrients.polyunsaturated_fat,
        "Cholesterol" to nutrients.cholesterol,
        "Salt" to nutrients.salt,
        "Sodium" to nutrients.sodium,
        "Carbohydrates" to nutrients.carbs,
        "Fiber" to nutrients.fiber,
        "Sugars" to nutrients.sugars,
        "Calcium" to nutrients.calcium,
        "Iron" to nutrients.iron,
        "Magnesium" to nutrients.magnesium,
        "Potassium" to nutrients.potassium,
        "Zinc" to nutrients.zinc,
        "Caffeine" to nutrients.caffeine
    ).filter { it.second != null }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        nutrientPairs.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                row.forEach { (label, value) ->
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        SelectionContainer {
                            Text(
                                text = value ?: "N/A",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
                // Fill remaining space if odd number of items
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun ProductDetailRow(label: String, value: String?, modifier: Modifier = Modifier) {
    value?.let {
        SelectionContainer {
            Column(modifier = modifier.fillMaxWidth()) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodyMedium
                )
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
    } catch (e: java.text.ParseException) {
        Log.e("BarcodeResultScreen", "Error parsing date $dateString: $e")
        dateString // Return original string if parsing fails
    }
}
