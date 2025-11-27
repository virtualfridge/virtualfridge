package com.cpen321.usermanagement.data.remote.dto

data class MealSummaryDto(
    val idMeal: String,
    val strMeal: String,
    val strMealThumb: String?
)

data class Ingredient(
    val name: String,
    val measure: String,
)

data class RecipeData(
    val recipe: Recipe
)

data class Recipe(
    val name: String,
    val instructions: String,
    val thumbnail: String?,
    val youtube: String?,
    val ingredients: List<Ingredient>,
    val source: String?,
    val image: String?,
)

data class AiRecipeData(
    val ingredients: List<String>,
    val prompt: String,
    val recipe: String,
    val model: String
)
