package com.cpen321.usermanagement.data.repository;

import android.content.Context;
import android.util.Log

import com.cpen321.usermanagement.data.local.preferences.TokenManager;
import com.cpen321.usermanagement.data.remote.api.FoodItemInterface;
import com.cpen321.usermanagement.data.remote.dto.CreateFoodItemBody
import com.cpen321.usermanagement.data.remote.dto.FoodItem
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemBody
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage

import javax.inject.Inject;

import dagger.hilt.android.qualifiers.ApplicationContext;
import java.util.Date
import javax.inject.Singleton
import kotlin.math.exp

@Singleton
class FoodItemRepositoryImpl @Inject constructor(
    private val foodItemInterface:FoodItemInterface,
    ) : FoodItemRepository {

    companion object {
        private const val TAG = "FoodItemRepositoryImpl"
    }

    override suspend fun createFoodItem(
        typeId: String,
        barcodeId: String?,
        expirationDate: Date,
        percentLeft: Double
    ): Result<FoodItem> {
        return try {
            val fixme = "Test"
            val createBody = CreateFoodItemBody(userId = fixme, typeId = typeId, barcodeId = barcodeId, expirationDate = expirationDate.toString(), percentLeft = percentLeft)
            val response = foodItemInterface.createFoodItem("", createBody);
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.foodItem)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to create foodItem.")
                Log.e(TAG, "Failed to create foodItem: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while creating foodItem", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while creating foodItem", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while creating foodItem", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while creating foodItem: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun updateFoodItem(
        _id: String,
        userId: String?,
        expirationDate: String?,
        percentLeft: Double?
    ): Result<FoodItem> {
        return try {
        val updateBody = UpdateFoodItemBody(_id = _id, userId = userId, expirationDate = expirationDate, percentLeft = percentLeft)
        val response = foodItemInterface.updateFoodItem("", updateBody) // Auth header is handled by interceptor
        if (response.isSuccessful && response.body()?.data != null) {
            Result.success(response.body()!!.data!!.foodItem)
        } else {
            val errorBodyString = response.errorBody()?.string()
            val errorMessage = parseErrorMessage(errorBodyString, "Failed to update foodItem.")
            Log.e(TAG, "Failed to update foodItem: $errorMessage")
            Result.failure(Exception(errorMessage))
        }
    } catch (e: java.net.SocketTimeoutException) {
        Log.e(TAG, "Network timeout while updating foodItem", e)
        Result.failure(e)
    } catch (e: java.net.UnknownHostException) {
        Log.e(TAG, "Network connection failed while updating foodItem", e)
        Result.failure(e)
    } catch (e: java.io.IOException) {
        Log.e(TAG, "IO error while updating foodItem", e)
        Result.failure(e)
    } catch (e: retrofit2.HttpException) {
        Log.e(TAG, "HTTP error while updating foodItem: ${e.code()}", e)
        Result.failure(e)
    }
}

    override suspend fun findFoodItemById(_id: String): Result<FoodItem> {
        return try {
            val response = foodItemInterface.findFoodItemById("",_id)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.foodItem)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to find foodItem.")
                Log.e(TAG, "Failed to find foodItem: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while finding foodItem", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while finding foodItem", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while finding foodItem", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while finding foodItem: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun deleteFoodItem(_id: String): Result<Unit> {
        return try {
            val response = foodItemInterface.findFoodItemById("",_id)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to delete foodItem.")
                Log.e(TAG, "Failed to delete foodItem: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while deleting foodItem", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while deleting foodItem", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while deleting foodItem", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while deleting foodItem: ${e.code()}", e)
            Result.failure(e)
        }
    }
}
