package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.BarcodeRequest
import com.cpen321.usermanagement.data.remote.dto.FridgeItemData
import com.cpen321.usermanagement.data.remote.dto.FridgeItemsData
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemData
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT


interface FridgeInterface {
    @GET("fridge")
    suspend fun getFridgeItems(
        @Header("Authorization") authHeader: String
    ): Response<ApiResponse<FridgeItemsData>>

    @PUT("food-item")
    suspend fun updateFoodItem(
        @Header("Authorization") authHeader: String,
        @Body request: UpdateFoodItemRequest
    ): Response<ApiResponse<UpdateFoodItemData>>

    @POST("fridge/barcode")
    suspend fun sendBarcode(
        @Header("Authorization") authHeader: String,
        @Body request: BarcodeRequest,
    ): Response<ApiResponse<FridgeItemData>>
}