package com.cpen321.usermanagement.ui.screens

import com.cpen321.usermanagement.ui.components.Icon
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun TestBarcodeScreen(
    mainViewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val uiState by mainViewModel.uiState.collectAsState()
    val spacing = LocalSpacing.current

    LaunchedEffect(Unit) {
        mainViewModel.clearTestBarcodeState()
    }

    Scaffold(
        topBar = {
            TestBarcodeTopBar(onBackClick = onBackClick)
        }
    ) { paddingValues ->
        TestBarcodeContent(
            paddingValues = paddingValues,
            isSending = uiState.isSendingTestBarcode,
            fridgeItem = uiState.testBarcodeResponse,
            onSendTestBarcode = { mainViewModel.testSendBarcode() },
            errorMessage = uiState.scanError
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TestBarcodeTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = "Test Barcode",
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
private fun TestBarcodeContent(
    paddingValues: PaddingValues,
    isSending: Boolean,
    fridgeItem: FridgeItem?,
    onSendTestBarcode: () -> Unit,
    errorMessage: String?,
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
        Text(
            text = "Send the default test barcode to the backend and review the response.",
            style = MaterialTheme.typography.bodyLarge
        )

        Button(
            onClick = onSendTestBarcode,
            modifier = Modifier.fillMaxWidth(),
            enabled = !isSending
        ) {
            Text(
                text = if (isSending) "Sending..." else "Send Test Barcode"
            )
        }

        if (isSending) {
            CircularProgressIndicator()
        }

        errorMessage?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        fridgeItem?.let { data ->
            val foodItem = data.foodItem
            val foodType = data.foodType
            
            Text(
                text = "Product Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            ProductDetailRow(label = "Name", value = foodType.name)
            ProductDetailRow(label = "Brand", value = foodType.brand)
            ProductDetailRow(label = "Quantity", value = foodType.quantity)
            ProductDetailRow(label = "Quantity Left", value = "${foodItem.percentLeft}%")
            
            foodType.shelfLifeDays?.let { days ->
                ProductDetailRow(label = "Shelf Life", value = "$days days")
            }
            
            foodItem.expirationDate?.let { date ->
                ProductDetailRow(
                    label = "Your Item Expiration Date", 
                    value = formatDate(date)
                )
            }
            
            foodType.expiration_date?.let { date ->
                ProductDetailRow(
                    label = "Product Expiration Date", 
                    value = date
                )
            }

            foodType.nutrients?.let { nutrients ->
                Text(
                    text = "Nutrients (per 100g)",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )

                ProductDetailRow(label = "Calories (kcal)", value = nutrients.calories)
                ProductDetailRow(label = "Energy (kJ)", value = nutrients.energy_kj)
                ProductDetailRow(label = "Protein (g)", value = nutrients.protein)
                ProductDetailRow(label = "Fat (g)", value = nutrients.fat)
                ProductDetailRow(label = "Saturated Fat (g)", value = nutrients.saturated_fat)
                ProductDetailRow(label = "Trans Fat (g)", value = nutrients.trans_fat)
                ProductDetailRow(label = "Carbohydrates (g)", value = nutrients.carbs)
                ProductDetailRow(label = "Sugars (g)", value = nutrients.sugars)
                ProductDetailRow(label = "Fiber (g)", value = nutrients.fiber)
                ProductDetailRow(label = "Salt (g)", value = nutrients.salt)
                ProductDetailRow(label = "Sodium (mg)", value = nutrients.sodium)
                ProductDetailRow(label = "Calcium (mg)", value = nutrients.calcium)
                ProductDetailRow(label = "Iron (mg)", value = nutrients.iron)
                ProductDetailRow(label = "Magnesium (mg)", value = nutrients.magnesium)
                ProductDetailRow(label = "Potassium (mg)", value = nutrients.potassium)
                ProductDetailRow(label = "Zinc (mg)", value = nutrients.zinc)
                ProductDetailRow(label = "Caffeine (mg)", value = nutrients.caffeine)
            }

            foodType.ingredients?.let { ingredients ->
                Text(
                    text = "Ingredients",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                SelectionContainer {
                    Text(
                        text = ingredients,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            foodType.allergens?.let { allergens ->
                if (allergens.isNotEmpty()) {
                    Text(
                        text = "Allergens",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium
                    )
                    SelectionContainer {
                        Text(
                            text = allergens.joinToString(", "),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
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
                    fontWeight = FontWeight.Medium
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
    } catch (e: Exception) {
        dateString // Return original string if parsing fails
    }
}
