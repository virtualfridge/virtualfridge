package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

data class BarcodeRequest(
    val barcode: String
)

interface BarcodeInterface {
    @POST("barcode")
    suspend fun sendBarcode(
        @Body request: BarcodeRequest,
        @Header("Authorization") authHeader: String
    ): Response<ApiResponse<Unit>>
}
