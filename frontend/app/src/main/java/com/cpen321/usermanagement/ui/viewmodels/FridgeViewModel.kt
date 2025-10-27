package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.data.repository.FridgeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class SortOption {
    EXPIRATION_DATE,
    ADDED_DATE,
    NUTRITIONAL_VALUE,
    NAME
}

data class FridgeUiState(
    // Loading states
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,

    // Data states
    val fridgeItems: List<FridgeItem> = emptyList(),
    val selectedItems: Set<String> = emptySet(), // Set of item IDs
    val sortOption: SortOption = SortOption.EXPIRATION_DATE,

    // UI states
    val showRecipeOptions: Boolean = false,

    // Message states
    val error: String? = null,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class FridgeViewModel @Inject constructor(
    private val fridgeRepository: FridgeRepository
) : ViewModel() {

    companion object {
        private const val TAG = "FridgeViewModel"
    }

    private val _uiState = MutableStateFlow(FridgeUiState())
    val uiState: StateFlow<FridgeUiState> = _uiState.asStateFlow()

    init {
        loadFridgeItems()
    }

    fun loadFridgeItems() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                error = null,
                errorMessage = null
            )

            val result = fridgeRepository.getFridgeItems()

            if (result.isSuccess) {
                val items = result.getOrNull() ?: emptyList()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    fridgeItems = sortItems(items, _uiState.value.sortOption)
                )
            } else {
                val error = result.exceptionOrNull()
                Log.e(TAG, "Failed to load fridge items", error)
                val errorMessage = error?.message ?: "Failed to load fridge items"

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = errorMessage,
                    errorMessage = errorMessage
                )
            }
        }
    }

    private fun sortItems(items: List<FridgeItem>, sortOption: SortOption): List<FridgeItem> {
        return when (sortOption) {
            SortOption.EXPIRATION_DATE -> items.sortedBy { it.foodItem.expirationDate }
            SortOption.ADDED_DATE -> items.sortedBy { it.foodItem._id } // MongoDB IDs are chronological
            SortOption.NUTRITIONAL_VALUE -> items.sortedByDescending {
                // Sort by calories (higher calories = higher nutritional value as a proxy)
                it.foodType.nutrients?.calories?.toDoubleOrNull() ?: 0.0
            }
            SortOption.NAME -> items.sortedBy { it.foodType.name }
        }
    }

    fun setSortOption(option: SortOption) {
        _uiState.value = _uiState.value.copy(
            sortOption = option,
            fridgeItems = sortItems(_uiState.value.fridgeItems, option)
        )
    }

    fun toggleItemSelection(itemId: String) {
        val currentSelected = _uiState.value.selectedItems.toMutableSet()
        if (currentSelected.contains(itemId)) {
            currentSelected.remove(itemId)
        } else {
            currentSelected.add(itemId)
        }
        _uiState.value = _uiState.value.copy(selectedItems = currentSelected)
    }

    fun clearSelection() {
        _uiState.value = _uiState.value.copy(selectedItems = emptySet())
    }

    fun showRecipeOptions() {
        if (_uiState.value.selectedItems.isNotEmpty()) {
            _uiState.value = _uiState.value.copy(showRecipeOptions = true)
        }
    }

    fun hideRecipeOptions() {
        _uiState.value = _uiState.value.copy(showRecipeOptions = false)
    }

    fun updateFoodItemPercent(itemId: String, percent: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isUpdating = true,
                error = null,
                errorMessage = null
            )

            val result = fridgeRepository.updateFoodItem(itemId, percent)

            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    isUpdating = false,
                    successMessage = "Item updated successfully"
                )
                // Reload the fridge items
                loadFridgeItems()
            } else {
                val error = result.exceptionOrNull()
                Log.e(TAG, "Failed to update item", error)
                val errorMessage = error?.message ?: "Failed to update item"

                _uiState.value = _uiState.value.copy(
                    isUpdating = false,
                    error = errorMessage,
                    errorMessage = errorMessage
                )
            }
        }
    }

    fun removeFoodItem(itemId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                error = null,
                errorMessage = null
            )

            val result = fridgeRepository.deleteFoodItem(itemId)

            if (result.isSuccess) {
                // Remove from selected items if it was selected
                val currentSelected = _uiState.value.selectedItems.toMutableSet()
                currentSelected.remove(itemId)

                _uiState.value = _uiState.value.copy(
                    selectedItems = currentSelected,
                    successMessage = "Item removed successfully"
                )

                // Reload the fridge items
                loadFridgeItems()
            } else {
                val error = result.exceptionOrNull()
                Log.e(TAG, "Failed to remove item", error)
                val errorMessage = error?.message ?: "Failed to remove item"

                _uiState.value = _uiState.value.copy(
                    error = errorMessage,
                    errorMessage = errorMessage
                )
            }
        }
    }

    fun deleteFoodItem(itemId: String) {
        removeFoodItem(itemId)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(
            error = null,
            errorMessage = null
        )
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    fun getSelectedItemsData(): List<FridgeItem> {
        val selectedIds = _uiState.value.selectedItems
        return _uiState.value.fridgeItems.filter { item ->
            selectedIds.contains(item.foodItem._id)
        }
    }
}
