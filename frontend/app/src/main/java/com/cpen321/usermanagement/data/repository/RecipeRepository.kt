package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.RecipeDataDto

data class RecipeFetchResult(
    val recipeData: RecipeDataDto,
    val rawJson: String
)

interface RecipeRepository {
    suspend fun fetchRecipes(ingredients: List<String>? = null): Result<RecipeFetchResult>
}
