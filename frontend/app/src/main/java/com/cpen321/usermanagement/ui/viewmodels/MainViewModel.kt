package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.MealSummaryDto
import com.cpen321.usermanagement.data.repository.BarcodeRepository
import com.cpen321.usermanagement.data.repository.RecipeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

data class MainUiState(
    val successMessage: String? = null,
    val lastScannedBarcode: String? = null,
    val scanError: String? = null,
    val recipesJson: String? = null,
    val recipeIngredients: List<String> = emptyList(),
    val recipeSource: String? = null,
    val recipeError: String? = null,
    val isFetchingRecipes: Boolean = false,
    val recipeSummaries: List<MealSummaryDto> = emptyList()
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val barcodeRepository: BarcodeRepository,
    private val recipeRepository: RecipeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    // --- Success/Error messaging ---
    fun setSuccessMessage(message: String) {
        _uiState.value = _uiState.value.copy(successMessage = message)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    fun setScanError(message: String) {
        _uiState.value = _uiState.value.copy(scanError = message)
    }

    fun clearScanError() {
        _uiState.value = _uiState.value.copy(scanError = null)
    }

    // --- Barcode handling ---
    fun handleScannedBarcode(barcode: String) {
        _uiState.value = _uiState.value.copy(lastScannedBarcode = barcode)

        // Send barcode to backend
        viewModelScope.launch {
            val result = barcodeRepository.sendBarcode(barcode)
            result.fold(
                onSuccess = {
                    setSuccessMessage("Barcode sent successfully!")
                },
                onFailure = { error ->
                    setScanError("Failed to send barcode: ${error.message ?: "Unknown error"}")
                }
            )
        }
    }

    // --- Test sending a static barcode (e.g., Nutella) ---
    fun testSendBarcode() {
        viewModelScope.launch {
            val testBarcode = "3017620425035" // Nutella barcode
            Log.d("BarcodeTest", "Sending test barcode: $testBarcode")

            val result = barcodeRepository.sendBarcode(testBarcode)
            result.fold(
                onSuccess = {
                    Log.d("BarcodeTest", "Successfully sent test barcode")
                    setSuccessMessage("Test barcode sent successfully!")
                },
                onFailure = { error ->
                    Log.e("BarcodeTest", "Failed to send test barcode: ${error.message}", error)
                    setScanError("Test barcode failed: ${error.message ?: "Unknown error"}")
                }
            )
        }
    }

    // --- Recipe fetching ---
    fun fetchSampleRecipes() {
        fetchRecipes(listOf("chicken_breast"))
    }

    fun fetchRecipes(ingredients: List<String>? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isFetchingRecipes = true,
                recipeError = null
            )

            val result = recipeRepository.fetchRecipes(ingredients)
            result.fold(
                onSuccess = { recipeResult ->
                    _uiState.value = _uiState.value.copy(
                        recipesJson = recipeResult.rawJson,
                        recipeIngredients = formatIngredients(recipeResult.recipeData.ingredients),
                        recipeSource = recipeResult.recipeData.externalSource,
                        recipeSummaries = recipeResult.recipeData.meals,
                        isFetchingRecipes = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        recipeError = error.message ?: "Failed to fetch recipes.",
                        isFetchingRecipes = false
                    )
                }
            )
        }
    }

    fun clearRecipeError() {
        _uiState.value = _uiState.value.copy(recipeError = null)
    }

    private fun formatIngredients(rawIngredients: List<String>): List<String> {
        return rawIngredients.mapNotNull { ingredient ->
            val cleaned = ingredient.replace('_', ' ').trim()
            if (cleaned.isEmpty()) return@mapNotNull null
            cleaned
                .lowercase()
                .split(" ")
                .filter { it.isNotBlank() }
                .joinToString(" ") { part ->
                    part.replaceFirstChar { char ->
                        if (char.isLowerCase()) char.titlecase(Locale.getDefault())
                        else char.toString()
                    }
                }
        }
    }
}
