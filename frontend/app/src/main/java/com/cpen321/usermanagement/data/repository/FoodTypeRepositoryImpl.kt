package com.cpen321.usermanagement.data.repository;

import android.util.Log

import com.cpen321.usermanagement.data.remote.api.FoodTypeInterface;
import com.cpen321.usermanagement.data.remote.dto.CreateFoodTypeBody
import com.cpen321.usermanagement.data.remote.dto.FoodType
import com.cpen321.usermanagement.data.remote.dto.NutritionalInfo
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodTypeBody
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage

import javax.inject.Inject;

import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Singleton

@Singleton
class FoodTypeRepositoryImpl @Inject constructor(
    private val foodTypeInterface: FoodTypeInterface,
) : FoodTypeRepository {

    companion object {
        private const val TAG = "FoodTypeRepositoryImpl"
    }

    override suspend fun createFoodType(
        name: String,
        shelfLifeDays: Int,
        barcodeId: String?,
        nutritionalInfo: NutritionalInfo?,
    ): Result<FoodType> {
        return try {
            val createBody = CreateFoodTypeBody(
                name = name,
                shelfLifeDays = shelfLifeDays,
                barcodeId = barcodeId,
                nutritionalInfo = nutritionalInfo
            )
            val response = foodTypeInterface.createFoodType("", createBody);
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.foodType)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to create foodType.")
                Log.e(TAG, "Failed to create foodType: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while creating foodType", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while creating foodType", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while creating foodType", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while creating foodType: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun updateFoodType(
        _id: String,
        name: String?,
        shelfLifeDays: Int?,
        barcodeId: String?,
        nutritionalInfo: NutritionalInfo?
    ): Result<FoodType> {
        return try {
            val updateBody = UpdateFoodTypeBody(
                _id = _id,
                name = name,
                shelfLifeDays = shelfLifeDays,
                barcodeId = barcodeId,
                nutritionalInfo = nutritionalInfo
            )
            val response = foodTypeInterface.updateFoodType(
                "",
                updateBody
            ) // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.foodType)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to update foodType.")
                Log.e(TAG, "Failed to update foodType: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while updating foodType", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while updating foodType", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while updating foodType", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while updating foodType: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun findFoodTypeById(_id: String): Result<FoodType> {
        return try {
            val response = foodTypeInterface.findFoodTypeById("", _id)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.foodType)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to find foodType.")
                Log.e(TAG, "Failed to find foodType: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while finding foodType", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while finding foodType", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while finding foodType", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while finding foodType: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun deleteFoodType(_id: String): Result<Unit> {
        return try {
            val response = foodTypeInterface.findFoodTypeById("", _id)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(Unit)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to delete foodType.")
                Log.e(TAG, "Failed to delete foodType: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while deleting foodType", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while deleting foodType", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while deleting foodType", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while deleting foodType: ${e.code()}", e)
            Result.failure(e)
        }
    }
}
