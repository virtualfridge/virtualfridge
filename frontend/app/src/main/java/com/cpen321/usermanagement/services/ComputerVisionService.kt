package com.cpen321.usermanagement.services

import android.graphics.Bitmap
import android.util.Log
import com.cpen321.usermanagement.data.model.DetectedLabel
import com.cpen321.usermanagement.data.model.FoodCategories
import com.cpen321.usermanagement.data.model.FoodDetectionResult
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class ComputerVisionService {
    
    companion object {
        private const val TAG = "ComputerVisionService"
        private const val FOOD_CONFIDENCE_THRESHOLD = 0.3f
        private const val MIN_CONFIDENCE_THRESHOLD = 0.2f
    }
    
    private val imageLabeler = ImageLabeling.getClient(
        ImageLabelerOptions.Builder()
            .setConfidenceThreshold(MIN_CONFIDENCE_THRESHOLD)
            .build()
    )
    
    suspend fun analyzeImage(bitmap: Bitmap): FoodDetectionResult {
        return try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val labels = processImageLabels(inputImage)
            
            val foodResult = analyzeLabelsForFood(labels)
            Log.d(TAG, "Analysis complete: isFood=${foodResult.isFood}, confidence=${foodResult.confidence}")
            
            foodResult
        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing image", e)
            FoodDetectionResult(
                isFood = false,
                confidence = 0f,
                detectedLabels = emptyList(),
                isNonFoodItem = true
            )
        }
    }
    
    private suspend fun processImageLabels(inputImage: InputImage): List<DetectedLabel> {
        return suspendCancellableCoroutine { continuation ->
            imageLabeler.process(inputImage)
                .addOnSuccessListener { labels ->
                    val detectedLabels = labels.map { label ->
                        DetectedLabel(
                            text = label.text,
                            confidence = label.confidence
                        )
                    }
                    continuation.resume(detectedLabels)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Image labeling failed", exception)
                    continuation.resumeWithException(exception)
                }
        }
    }
    
    private fun analyzeLabelsForFood(labels: List<DetectedLabel>): FoodDetectionResult {
        var maxFoodConfidence = 0f
        var maxNonFoodConfidence = 0f
        val foodLabels = mutableListOf<String>()
        val nonFoodLabels = mutableListOf<String>()
        
        // Analyze each detected label
        labels.forEach { label ->
            val text = label.text.lowercase()
            val confidence = label.confidence
            
            // Check if it's a food-related label
            val isFoodLabel = FoodCategories.FOOD_KEYWORDS.any { keyword ->
                text.contains(keyword, ignoreCase = true)
            }
            
            // Check if it's a non-food label
            val isNonFoodLabel = FoodCategories.NON_FOOD_KEYWORDS.any { keyword ->
                text.contains(keyword, ignoreCase = true)
            }
            
            when {
                isFoodLabel -> {
                    if (confidence > maxFoodConfidence) {
                        maxFoodConfidence = confidence
                    }
                    foodLabels.add(label.text)
                }
                isNonFoodLabel -> {
                    if (confidence > maxNonFoodConfidence) {
                        maxNonFoodConfidence = confidence
                    }
                    nonFoodLabels.add(label.text)
                }
            }
        }
        
        // Determine if the item is food based on confidence and label analysis
        val isFood = when {
            maxFoodConfidence > FOOD_CONFIDENCE_THRESHOLD -> true
            maxNonFoodConfidence > maxFoodConfidence -> false
            foodLabels.isNotEmpty() && nonFoodLabels.isEmpty() -> true
            foodLabels.isEmpty() && nonFoodLabels.isNotEmpty() -> false
            else -> maxFoodConfidence > maxNonFoodConfidence
        }
        
        val overallConfidence = if (isFood) maxFoodConfidence else maxNonFoodConfidence
        
        return FoodDetectionResult(
            isFood = isFood,
            confidence = overallConfidence,
            detectedLabels = labels,
            suggestedFoodItems = if (isFood) foodLabels else emptyList(),
            isNonFoodItem = !isFood && nonFoodLabels.isNotEmpty()
        )
    }
    
    fun cleanup() {
        imageLabeler.close()
    }
}