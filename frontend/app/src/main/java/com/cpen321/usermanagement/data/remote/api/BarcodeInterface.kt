package com.cpen321.usermanagement.data.remote.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

data class BarcodeRequest(
    val barcode: String
)

data class BarcodeResponse(
    val success: Boolean,
    val response: BarcodeResultData
)

data class BarcodeResultData(
    val foodItem: FoodItem,
    val foodType: FoodType
)

interface BarcodeInterface {
    @POST("barcode")
    suspend fun sendBarcode(
        @Header("Authorization") authHeader: String,
        @Body request: BarcodeRequest,
    ): Response<BarcodeResponse>
}

