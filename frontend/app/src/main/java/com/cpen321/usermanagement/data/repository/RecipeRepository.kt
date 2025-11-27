package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.AiRecipeData
import com.cpen321.usermanagement.data.remote.dto.RecipeData

data class RecipeFetchResult(
    val recipeData: RecipeData,
    val rawJson: String
)

data class AiRecipeFetchResult(
    val recipeData: AiRecipeData,
    val formattedRecipe: String
)

interface RecipeRepository {
    suspend fun fetchRecipes(ingredients: List<String>? = null): Result<RecipeFetchResult>
    suspend fun generateAiRecipe(ingredients: List<String>): Result<AiRecipeFetchResult>
}
