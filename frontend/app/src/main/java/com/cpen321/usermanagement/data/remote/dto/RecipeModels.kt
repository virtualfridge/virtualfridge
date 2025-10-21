package com.cpen321.usermanagement.data.remote.dto

data class MealSummaryDto(
    val idMeal: String,
    val strMeal: String,
    val strMealThumb: String?
)

data class RecipeDataDto(
    val ingredients: List<String>,
    val meals: List<MealSummaryDto>,
    val externalSource: String
)
