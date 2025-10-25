package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.FridgeItemsResponse
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemRequest
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT


interface FridgeInterface {
    @GET("fridge")
    suspend fun getFridgeItems(
        @Header("Authorization") authHeader: String
    ): Response<FridgeItemsResponse>

    @PUT("food-item")
    suspend fun updateFoodItem(
        @Header("Authorization") authHeader: String,
        @Body request: UpdateFoodItemRequest
    ): Response<UpdateFoodItemResponse>
}