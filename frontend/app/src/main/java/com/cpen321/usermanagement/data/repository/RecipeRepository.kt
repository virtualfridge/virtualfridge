package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.AiRecipeDataDto
import com.cpen321.usermanagement.data.remote.dto.RecipeDataDto

data class RecipeFetchResult(
    val recipeData: RecipeDataDto,
    val rawJson: String
)

data class AiRecipeFetchResult(
    val recipeData: AiRecipeDataDto,
    val formattedRecipe: String
)

interface RecipeRepository {
    suspend fun fetchRecipes(ingredients: List<String>? = null): Result<RecipeFetchResult>
    suspend fun generateAiRecipe(ingredients: List<String>): Result<AiRecipeFetchResult>
}
