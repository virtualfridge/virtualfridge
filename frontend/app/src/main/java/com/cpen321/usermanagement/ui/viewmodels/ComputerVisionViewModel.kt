package com.cpen321.usermanagement.ui.viewmodels

import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.model.FoodDetectionResult
import com.cpen321.usermanagement.services.ComputerVisionService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ComputerVisionUiState(
    val isAnalyzing: Boolean = false,
    val capturedImage: Bitmap? = null,
    val detectionResult: FoodDetectionResult? = null,
    val error: String? = null
)

@HiltViewModel
class ComputerVisionViewModel @Inject constructor(
    private val computerVisionService: ComputerVisionService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ComputerVisionUiState())
    val uiState: StateFlow<ComputerVisionUiState> = _uiState.asStateFlow()

    fun analyzeImage(bitmap: Bitmap) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(
                    isAnalyzing = true,
                    capturedImage = bitmap,
                    error = null
                )
                
                val result = computerVisionService.analyzeImage(bitmap)
                
                _uiState.value = _uiState.value.copy(
                    isAnalyzing = false,
                    detectionResult = result
                )
                
                Log.d("ComputerVisionViewModel", "Analysis complete: ${result.isFood}")
            } catch (e: Exception) {
                Log.e("ComputerVisionViewModel", "Error analyzing image", e)
                _uiState.value = _uiState.value.copy(
                    isAnalyzing = false,
                    error = "Failed to analyze image: ${e.message}"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun resetState() {
        _uiState.value = ComputerVisionUiState()
    }

    override fun onCleared() {
        super.onCleared()
        computerVisionService.cleanup()
    }
}