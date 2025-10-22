package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.AiRecipeDataDto
import com.cpen321.usermanagement.data.remote.dto.RecipeDataDto
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Header
import retrofit2.http.Query

data class AiRecipeRequest(
    val ingredients: List<String>
)

interface RecipeInterface {
    @GET("recipes")
    suspend fun getRecipes(
        @Header("Authorization") authHeader: String,
        @Query("ingredients") ingredients: String? = null
    ): Response<ApiResponse<RecipeDataDto>>

    @POST("recipes/ai")
    suspend fun generateAiRecipe(
        @Header("Authorization") authHeader: String,
        @Body request: AiRecipeRequest
    ): Response<ApiResponse<AiRecipeDataDto>>
}
