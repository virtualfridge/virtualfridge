package com.cpen321.usermanagement.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.repository.BarcodeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainUiState(
    val successMessage: String? = null,
    val lastScannedBarcode: String? = null,
    val scanError: String? = null
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val barcodeRepository: BarcodeRepository
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
}
