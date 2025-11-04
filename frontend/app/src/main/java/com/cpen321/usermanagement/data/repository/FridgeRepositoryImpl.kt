package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.FridgeInterface
import com.cpen321.usermanagement.data.remote.dto.BarcodeRequest
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemRequest
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FridgeRepositoryImpl @Inject constructor(
    private val fridgeInterface: FridgeInterface,
) : FridgeRepository {

    companion object {
        private const val TAG = "FridgeRepositoryImpl"
    }

    override suspend fun getFridgeItems(): Result<List<FridgeItem>> {
        return try {
            val response = fridgeInterface.getFridgeItems(
                "" // authHeader handled by interceptor
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
                    parseErrorMessage(errorBodyString, "Failed to fetch fridge items.")
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
            val request = UpdateFoodItemRequest(
                foodItemId, null, percentLeft
            )

            val response = fridgeInterface.updateFoodItem(
                "", // authHeader Handled by interceptor
                request
            )

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to update food item.")
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

    override suspend fun deleteFoodItem(foodItemId: String): Result<Unit> {
        return try {
            val response = fridgeInterface.deleteFoodItem(
                "", // authHeader Handled by interceptor
                foodItemId
            )

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to delete food item.")
                Log.e(TAG, "Food item delete failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while deleting food item", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while deleting food item", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while deleting food item", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while deleting food item", e)
            Result.failure(e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error while deleting food item", e)
            Result.failure(e)
        }
    }
    override suspend fun sendBarcode(barcode: String): Result<FridgeItem> {
        return try {
            val request = BarcodeRequest(barcode)
            val response = fridgeInterface.sendBarcode(
                "", // Auth header is handled by interceptor
                request,
            )

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && body.data != null) {
                    Result.success(body.data.fridgeItem)
                } else {
                    Result.failure(Exception("Empty product data received from server."))
                }
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to send barcode.")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}