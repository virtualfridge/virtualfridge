package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.FridgeInterface
import com.cpen321.usermanagement.data.remote.api.FridgeItem
import com.cpen321.usermanagement.data.remote.api.UpdateFoodItemRequest
import com.cpen321.usermanagement.utils.JsonUtils
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FridgeRepositoryImpl @Inject constructor(
    private val fridgeInterface: FridgeInterface,
    private val authRepository: AuthRepository
) : FridgeRepository {

    companion object {
        private const val TAG = "FridgeRepositoryImpl"
    }

    override suspend fun getFridgeItems(): Result<List<FridgeItem>> {
        return try {
            val token = authRepository.getStoredToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("User is not authenticated"))
            }

            val response = fridgeInterface.getFridgeItems(
                authHeader = "Bearer $token"
            )

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && body.data != null) {
                    Result.success(body.data.fridgeItems)
                } else {
                    Result.failure(Exception("Empty fridge data received from server."))
                }
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage =
                    JsonUtils.parseErrorMessage(errorBodyString, "Failed to fetch fridge items.")
                Log.e(TAG, "Fridge fetch failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while fetching fridge items", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while fetching fridge items", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while fetching fridge items", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while fetching fridge items", e)
            Result.failure(e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error while fetching fridge items", e)
            Result.failure(e)
        }
    }

    override suspend fun updateFoodItem(foodItemId: String, percentLeft: Int): Result<Unit> {
        return try {
            val token = authRepository.getStoredToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("User is not authenticated"))
            }

            val request = UpdateFoodItemRequest(
                _id = foodItemId,
                expirationDate = null,
                percentLeft = percentLeft
            )

            val response = fridgeInterface.updateFoodItem(
                authHeader = "Bearer $token",
                request = request
            )

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage =
                    JsonUtils.parseErrorMessage(errorBodyString, "Failed to update food item.")
                Log.e(TAG, "Food item update failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while updating food item", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while updating food item", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while updating food item", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while updating food item", e)
            Result.failure(e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error while updating food item", e)
            Result.failure(e)
        }
    }
}