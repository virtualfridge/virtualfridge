// BarcodeRepositoryImpl.kt
package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.BarcodeInterface
import com.cpen321.usermanagement.data.remote.api.BarcodeRequest
import com.cpen321.usermanagement.data.remote.dto.ProductDataDto
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton

data class FoodType(
    val _id: String,
    val name: String,
    val nutrients: Nutrients
)

data class Nutrients(
    val calories: String?,
    val protein: String?,
    val fat: String?,
    val carbohydrates: String?,
    val fiber: String?,
    val sugars: String?,
    val salt: String?,
    val sodium: String?,
    val calcium: String?,
    val iron: String?,
    val potassium: String?
)

class BarcodeRepositoryImpl @Inject constructor(
    private val barcodeInterface: BarcodeInterface,
    private val authRepository: AuthRepository // Inject AuthRepository to get token
) : BarcodeRepository {

    companion object {
        private const val TAG = "BarcodeRepositoryImpl"
    }

    data class BarcodeResponse(
        val success: Boolean,
        val foodType: FoodType,
    )

    override suspend fun sendBarcode(barcode: String): Result<FoodType> {
        return try {
            val token = authRepository.getStoredToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("User is not authenticated"))
            }

            val request = BarcodeRequest(barcode)
            val response = barcodeInterface.sendBarcode(
                request,
                authHeader = "Bearer $token"
            )

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body.foodType) // <-- get the foodType from backend


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
