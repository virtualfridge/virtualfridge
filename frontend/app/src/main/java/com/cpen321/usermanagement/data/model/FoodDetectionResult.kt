package com.cpen321.usermanagement.data.model

data class FoodDetectionResult(
    val isFood: Boolean,
    val confidence: Float,
    val detectedLabels: List<DetectedLabel>,
    val suggestedFoodItems: List<String> = emptyList(),
    val isNonFoodItem: Boolean = false
)

data class DetectedLabel(
    val text: String,
    val confidence: Float
)

// Common food categories for better classification
object FoodCategories {
    val FOOD_KEYWORDS = setOf(
        "food", "fruit", "vegetable", "meat", "dairy", "bread", "cereal", "snack",
        "apple", "banana", "orange", "tomato", "carrot", "lettuce", "onion",
        "chicken", "beef", "pork", "fish", "milk", "cheese", "yogurt",
        "bread", "pasta", "rice", "potato", "cookies", "cake", "chocolate"
    )
    
    val NON_FOOD_KEYWORDS = setOf(
        "book", "phone", "computer", "clothing", "furniture", "toy", "tool",
        "electronic", "paper", "plastic", "metal", "glass", "fabric"
    )
}