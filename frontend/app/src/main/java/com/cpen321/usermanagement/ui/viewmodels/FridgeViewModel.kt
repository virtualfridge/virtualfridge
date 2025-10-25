package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.repository.FridgeRepository
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

enum class SortOption {
    EXPIRATION_DATE,
    ADDED_DATE,
    NUTRITIONAL_VALUE,
    NAME
}

data class FridgeUiState(
    val fridgeItems: List<FridgeItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val sortOption: SortOption = SortOption.EXPIRATION_DATE,
    val isUpdating: Boolean = false
)

@HiltViewModel
class FridgeViewModel @Inject constructor(
    private val fridgeRepository: FridgeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FridgeUiState())
    val uiState: StateFlow<FridgeUiState> = _uiState.asStateFlow()

    init {
        loadFridgeItems()
    }

    fun loadFridgeItems() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            val result = fridgeRepository.getFridgeItems()
            result.fold(
                onSuccess = { items ->
                    val sortedItems = sortItems(items, _uiState.value.sortOption)
                    _uiState.value = _uiState.value.copy(
                        fridgeItems = sortedItems,
                        isLoading = false
                    )
                },
                onFailure = { error ->
                    Log.e("FridgeViewModel", "Failed to load fridge items", error)
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load fridge items"
                    )
                }
            )
        }
    }

    fun updateFoodItemPercent(foodItemId: String, newPercent: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUpdating = true, error = null)
            
            val result = fridgeRepository.updateFoodItem(foodItemId, newPercent)
            result.fold(
                onSuccess = {
                    // Update the local state
                    val updatedItems = _uiState.value.fridgeItems.map { item ->
                        if (item.foodItem._id == foodItemId) {
                            item.copy(
                                foodItem = item.foodItem.copy(percentLeft = newPercent)
                            )
                        } else {
                            item
                        }
                    }
                    
                    val sortedItems = sortItems(updatedItems, _uiState.value.sortOption)
                    _uiState.value = _uiState.value.copy(
                        fridgeItems = sortedItems,
                        isUpdating = false,
                        successMessage = if (newPercent == 0) "Item removed from fridge" else "Item updated successfully"
                    )
                },
                onFailure = { error ->
                    Log.e("FridgeViewModel", "Failed to update food item", error)
                    _uiState.value = _uiState.value.copy(
                        isUpdating = false,
                        error = error.message ?: "Failed to update item"
                    )
                }
            )
        }
    }

    fun removeFoodItem(foodItemId: String) {
        updateFoodItemPercent(foodItemId, 0)
    }

    fun setSortOption(sortOption: SortOption) {
        val sortedItems = sortItems(_uiState.value.fridgeItems, sortOption)
        _uiState.value = _uiState.value.copy(
            sortOption = sortOption,
            fridgeItems = sortedItems
        )
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    private fun sortItems(items: List<FridgeItem>, sortOption: SortOption): List<FridgeItem> {
        return when (sortOption) {
            SortOption.EXPIRATION_DATE -> {
                items.sortedBy { item ->
                    item.foodItem.expirationDate?.let { parseDate(it) } ?: Date(Long.MAX_VALUE)
                }
            }
            SortOption.ADDED_DATE -> {
                // Since we don't have added date in the current data structure,
                // we'll sort by food item ID as a proxy
                items.sortedBy { it.foodItem._id }
            }
            SortOption.NUTRITIONAL_VALUE -> {
                items.sortedByDescending { item ->
                    item.foodType.nutrients?.calories?.toDoubleOrNull() ?: 0.0
                }
            }
            SortOption.NAME -> {
                items.sortedBy { item ->
                    item.foodType.name ?: ""
                }
            }
        }
    }

    private fun parseDate(dateString: String): Date? {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            inputFormat.parse(dateString)
        } catch (e: Exception) {
            Log.e("FridgeViewModel", "Failed to parse date: $dateString", e)
            null
        }
    }

    fun getSortOptions(): List<SortOption> = SortOption.entries
}
