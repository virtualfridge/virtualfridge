package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
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
}
