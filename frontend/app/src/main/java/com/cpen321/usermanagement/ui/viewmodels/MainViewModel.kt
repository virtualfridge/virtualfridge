package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.MealSummaryDto
import com.cpen321.usermanagement.data.remote.dto.ProductDataDto
import com.cpen321.usermanagement.data.repository.BarcodeRepository
import com.cpen321.usermanagement.data.repository.FoodType
import com.cpen321.usermanagement.data.repository.RecipeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

data class IngredientOption(
    val key: String,
    val displayName: String
)

data class MainUiState(
    val successMessage: String? = null,
    val lastScannedBarcode: String? = null,
    val scanError: String? = null,
    val testBarcodeResponse: FoodType? = null,
    val isSendingTestBarcode: Boolean = false,
    val recipesJson: String? = null,
    val recipeIngredients: List<String> = emptyList(),
    val recipeSource: String? = null,
    val recipeError: String? = null,
    val isFetchingRecipes: Boolean = false,
    val recipeSummaries: List<MealSummaryDto> = emptyList(),
    val aiRecipe: String? = null,
    val aiPrompt: String? = null,
    val aiIngredients: List<String> = emptyList(),
    val aiModel: String? = null,
    val isGeneratingAiRecipe: Boolean = false,
    val aiError: String? = null,
    val selectedIngredientKeys: Set<String> = emptySet()
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val barcodeRepository: BarcodeRepository,
    private val recipeRepository: RecipeRepository
) : ViewModel() {

    private val ingredientOptions = listOf(
        IngredientOption(key = "chicken_breast", displayName = "Chicken Breast"),
        IngredientOption(key = "broccoli", displayName = "Broccoli"),
        IngredientOption(key = "carrot", displayName = "Carrot")
    )

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

    fun clearTestBarcodeState() {
        _uiState.value = _uiState.value.copy(
            testBarcodeResponse = null,
            isSendingTestBarcode = false,
            scanError = null,
            successMessage = null
        )
    }

    // --- Barcode handling ---
    fun handleScannedBarcode(barcode: String) {
        _uiState.value = _uiState.value.copy(lastScannedBarcode = barcode)

        // Send barcode to backend
        viewModelScope.launch {
            val result = barcodeRepository.sendBarcode(barcode)
            result.fold(
                onSuccess = { _ ->
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

            _uiState.value = _uiState.value.copy(
                isSendingTestBarcode = true,
                testBarcodeResponse = null,
                scanError = null,
                successMessage = null
            )

            val result = barcodeRepository.sendBarcode(testBarcode)
            result.fold(
                onSuccess = { productData ->
                    Log.d("BarcodeTest", "Successfully sent test barcode")
                    _uiState.value = _uiState.value.copy(
                        testBarcodeResponse = productData,
                        isSendingTestBarcode = false
                    )
                },
                onFailure = { error ->
                    Log.e("BarcodeTest", "Failed to send test barcode: ${error.message}", error)
                    setScanError("Test barcode failed: ${error.message ?: "Unknown error"}")
                    _uiState.value = _uiState.value.copy(isSendingTestBarcode = false)
                }
            )
        }
    }

    // --- Recipe fetching ---
    fun fetchRecipes(ingredients: List<String>? = null) {
        val resolvedIngredients = resolveIngredients(ingredients)

        if (resolvedIngredients.isEmpty()) {
            _uiState.value = _uiState.value.copy(
                recipeError = "Please select at least one ingredient."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isFetchingRecipes = true,
                recipeError = null,
                recipesJson = null,
                recipeSource = null,
                recipeSummaries = emptyList(),
                recipeIngredients = emptyList(),
                aiRecipe = null,
                aiPrompt = null,
                aiIngredients = emptyList(),
                aiModel = null,
                aiError = null
            )

            val result = recipeRepository.fetchRecipes(resolvedIngredients)
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

    fun getIngredientOptions(): List<IngredientOption> = ingredientOptions

    fun isIngredientSelected(key: String): Boolean {
        return _uiState.value.selectedIngredientKeys.contains(key)
    }

    fun setIngredientSelection(key: String, selected: Boolean) {
        if (ingredientOptions.none { it.key == key }) {
            return
        }

        val updated = _uiState.value.selectedIngredientKeys.toMutableSet()
        if (selected) {
            updated.add(key)
        } else {
            updated.remove(key)
        }

        _uiState.value = _uiState.value.copy(
            selectedIngredientKeys = updated,
            recipeError = null,
            aiError = null
        )
    }

    fun generateAiRecipe(ingredients: List<String>? = null) {
        val resolvedIngredients = resolveIngredients(ingredients)

        if (resolvedIngredients.isEmpty()) {
            _uiState.value = _uiState.value.copy(
                aiError = "Please select at least one ingredient."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isGeneratingAiRecipe = true,
                aiError = null,
                aiRecipe = null,
                aiPrompt = null,
                aiIngredients = emptyList(),
                aiModel = null,
                recipesJson = null,
                recipeIngredients = emptyList(),
                recipeSource = null,
                recipeSummaries = emptyList(),
                recipeError = null
            )

            val result = recipeRepository.generateAiRecipe(resolvedIngredients)
            result.fold(
                onSuccess = { aiResult ->
                    _uiState.value = _uiState.value.copy(
                        aiRecipe = aiResult.formattedRecipe,
                        aiPrompt = aiResult.recipeData.prompt,
                        aiIngredients = formatIngredients(aiResult.recipeData.ingredients),
                        aiModel = aiResult.recipeData.model,
                        isGeneratingAiRecipe = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        aiError = error.message ?: "Failed to generate AI recipe.",
                        isGeneratingAiRecipe = false
                    )
                }
            )
        }
    }

    fun clearAiError() {
        _uiState.value = _uiState.value.copy(aiError = null)
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

    private fun resolveIngredients(ingredients: List<String>?): List<String> {
        val sanitized = ingredients
            ?.map { it.trim() }
            ?.filter { it.isNotEmpty() }

        return if (!sanitized.isNullOrEmpty()) {
            sanitized
        } else {
            _uiState.value.selectedIngredientKeys.toList()
        }
    }
}
