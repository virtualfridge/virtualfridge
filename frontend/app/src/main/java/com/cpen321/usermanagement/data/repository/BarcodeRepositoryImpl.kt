// BarcodeRepositoryImpl.kt
package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.BarcodeInterface
import com.cpen321.usermanagement.data.remote.api.BarcodeRequest
import com.cpen321.usermanagement.data.remote.api.BarcodeResultData
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

    override suspend fun sendBarcode(barcode: String): Result<BarcodeResultData> {
        return try {
            val request = BarcodeRequest(barcode)
            val response = barcodeInterface.sendBarcode(
                "", // Auth header is handled by interceptor
                request,
            )

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body.response)
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
