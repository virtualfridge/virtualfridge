package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.RecipeDataDto
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

interface RecipeInterface {
    @GET("recipes")
    suspend fun getRecipes(
        @Header("Authorization") authHeader: String,
        @Query("ingredients") ingredients: String? = null
    ): Response<ApiResponse<RecipeDataDto>>
}
