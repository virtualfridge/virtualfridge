package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.CreateFoodItemBody
import com.cpen321.usermanagement.data.remote.dto.FoodItemData
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodItemBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface FoodItemInterface {
    @POST("/food-item")
    suspend fun createFoodItem(@Header("Authorization") authHeader: String,
    @Body request: CreateFoodItemBody
    ): Response<ApiResponse<FoodItemData>>

    @PUT("/food-item")
    suspend fun updateFoodItem(
        @Header("Authorization") authHeader: String,
        @Body request: UpdateFoodItemBody
    ): Response<ApiResponse<FoodItemData>>

    @GET("/food-item/{_id}")
    suspend fun findFoodItemById(
        @Header("Authorization") authHeader: String,
        @Path("_id") _id: String
    ): Response<ApiResponse<FoodItemData>>

    @DELETE("/food-item{_id}")
    suspend fun deleteFoodItem(
        @Header("Authorization") authHeader: String,
        @Path("_id") _id: String
    ): Response<ApiResponse<FoodItemData>>
}