package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.AiRecipeRequest
import com.cpen321.usermanagement.data.remote.api.RecipeInterface
import com.cpen321.usermanagement.data.remote.dto.RecipeData
import com.google.gson.GsonBuilder
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RecipeRepositoryImpl @Inject constructor(
    private val recipeInterface: RecipeInterface,
    private val authRepository: AuthRepository
) : RecipeRepository {

    companion object {
        private const val TAG = "RecipeRepositoryImpl"
    }

    private val gson = GsonBuilder().setPrettyPrinting().create()

    override suspend fun fetchRecipes(ingredients: List<String>?): Result<RecipeFetchResult> {
        return try {
            val response = recipeInterface.getRecipes(
                authHeader = "",
                ingredients = ingredients?.joinToString(",")
            )

            if (response.isSuccessful) {
                val body = response.body()
                val recipe = body?.data?.recipe
                if (recipe != null) {
                    val rawJson = gson.toJson(body)
                    Result.success(RecipeFetchResult(recipe, rawJson))
                } else {
                    Result.failure(Exception("Empty recipe data received from server."))
                }
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(
                    errorBodyString,
                    "Failed to fetch recipes."
                )
                Log.e(TAG, "Recipe fetch failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while fetching recipes", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while fetching recipes", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while fetching recipes", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while fetching recipes: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun generateAiRecipe(ingredients: List<String>): Result<AiRecipeFetchResult> {
        return try {
            val token = authRepository.getStoredToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("User is not authenticated"))
            }

            val response = recipeInterface.generateAiRecipe(
                authHeader = "Bearer $token",
                request = AiRecipeRequest(ingredients)
            )

            if (response.isSuccessful) {
                val data = response.body()?.data
                if (data != null && data.recipe != null) {
                    Result.success(
                        AiRecipeFetchResult(
                            recipeData = data,
                            recipe = data.recipe
                        )
                    )
                } else {
                    Result.failure(Exception("Empty AI recipe response received from server."))
                }
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(
                    errorBodyString,
                    "Failed to generate AI recipe."
                )
                Log.e(TAG, "AI recipe generation failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while generating AI recipe", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while generating AI recipe", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while generating AI recipe", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while generating AI recipe: ${e.code()}", e)
            Result.failure(e)
        }
    }
}
