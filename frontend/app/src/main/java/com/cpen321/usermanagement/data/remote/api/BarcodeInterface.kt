package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.ProductDataDto
import com.cpen321.usermanagement.data.repository.FoodType
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

data class BarcodeRequest(
    val barcode: String
)

data class BarcodeResponse(
    val success: Boolean,
    val foodType: FoodType
)

interface BarcodeInterface {
    @POST("barcode")
    suspend fun sendBarcode(
        @Body request: BarcodeRequest,
        @Header("Authorization") authHeader: String
    ): Response<BarcodeResponse>
}

