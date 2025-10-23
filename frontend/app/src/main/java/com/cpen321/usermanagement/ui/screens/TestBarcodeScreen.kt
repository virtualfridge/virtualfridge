package com.cpen321.usermanagement.ui.screens

import Icon
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
import com.cpen321.usermanagement.data.remote.dto.ProductDataDto
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

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
            productData = uiState.testBarcodeResponse,
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
    productData: ProductDataDto?,
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

        productData?.let { data ->
            Text(
                text = "Product Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            ProductDetailRow(label = "Name", value = data.name)
            ProductDetailRow(label = "Brand", value = data.brand)
            ProductDetailRow(label = "Quantity", value = data.quantity)
            ProductDetailRow(label = "Ingredients", value = data.ingredients)
            ProductDetailRow(label = "Expiration Date", value = data.expiration_date)
            ProductDetailRow(label = "Image URL", value = data.image)

            data.nutrients?.let { nutrients ->
                Text(
                    text = "Nutrients",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )

                ProductDetailRow(label = "Calories (kcal/100g)", value = nutrients.calories?.toString())
                ProductDetailRow(label = "Protein (g/100g)", value = nutrients.protein?.toString())
                ProductDetailRow(label = "Fat (g/100g)", value = nutrients.fat?.toString())
                ProductDetailRow(label = "Saturated Fat (g/100g)", value = nutrients.saturated_fat?.toString())
                ProductDetailRow(label = "Carbs (g/100g)", value = nutrients.carbs?.toString())
                ProductDetailRow(label = "Sugars (g/100g)", value = nutrients.sugars?.toString())
                ProductDetailRow(label = "Fiber (g/100g)", value = nutrients.fiber?.toString())
                ProductDetailRow(label = "Salt (g/100g)", value = nutrients.salt?.toString())
                ProductDetailRow(label = "Sodium (mg/100g)", value = nutrients.sodium?.toString())
                ProductDetailRow(label = "Caffeine (mg/100g)", value = nutrients.caffeine?.toString())
            }

            data.minerals?.let { minerals ->
                Text(
                    text = "Minerals",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )

                ProductDetailRow(label = "Calcium (mg/100g)", value = minerals.calcium?.toString())
                ProductDetailRow(label = "Iron (mg/100g)", value = minerals.iron?.toString())
                ProductDetailRow(label = "Magnesium (mg/100g)", value = minerals.magnesium?.toString())
                ProductDetailRow(label = "Potassium (mg/100g)", value = minerals.potassium?.toString())
                ProductDetailRow(label = "Sodium (mg/100g)", value = minerals.sodium?.toString())
                ProductDetailRow(label = "Zinc (mg/100g)", value = minerals.zinc?.toString())
            }

            data.allergens?.takeIf { it.isNotEmpty() }?.let { allergens ->
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
