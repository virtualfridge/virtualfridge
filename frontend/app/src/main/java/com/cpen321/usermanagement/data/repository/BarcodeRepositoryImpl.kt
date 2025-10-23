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
class BarcodeRepositoryImpl @Inject constructor(
    private val barcodeInterface: BarcodeInterface,
    private val authRepository: AuthRepository // Inject AuthRepository to get token
) : BarcodeRepository {

    companion object {
        private const val TAG = "BarcodeRepositoryImpl"
    }

    override suspend fun sendBarcode(barcode: String): Result<ProductDataDto> {
        return try {
            // Get stored token from AuthRepository
            val token = authRepository.getStoredToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("User is not authenticated"))
            }

            // Create request object
            val request = BarcodeRequest(
                barcode = barcode,
            )

            // Send barcode with authorization header
            val response = barcodeInterface.sendBarcode(
                request,
                authHeader = "Bearer $token"
            )

            if (response.isSuccessful) {
                val data = response.body()?.data
                if (data != null) {
                    Result.success(data)
                } else {
                    Result.failure(Exception("Empty product data received from server."))
                }
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to send barcode.")
                Log.e(TAG, "Failed to send barcode: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: SocketTimeoutException) {
            Log.e(TAG, "Network timeout while sending barcode", e)
            Result.failure(e)
        } catch (e: UnknownHostException) {
            Log.e(TAG, "Network connection failed while sending barcode", e)
            Result.failure(e)
        } catch (e: IOException) {
            Log.e(TAG, "IO error while sending barcode", e)
            Result.failure(e)
        } catch (e: HttpException) {
            Log.e(TAG, "HTTP error while sending barcode: ${e.code()}", e)
            Result.failure(e)
        }
    }
}
