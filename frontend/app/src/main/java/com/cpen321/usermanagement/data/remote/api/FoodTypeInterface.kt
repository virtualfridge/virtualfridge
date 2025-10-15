package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.CreateFoodTypeBody
import com.cpen321.usermanagement.data.remote.dto.FoodTypeData
import com.cpen321.usermanagement.data.remote.dto.UpdateFoodTypeBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface FoodTypeInterface {
    @POST("/food-type")
    suspend fun createFoodType(@Header("Authorization") authHeader: String,
    @Body request: CreateFoodTypeBody): Response<ApiResponse<FoodTypeData>>

    @PUT("/food-type")
    suspend fun updateFoodType(
        @Header("Authorization") authHeader: String,
        @Body request: UpdateFoodTypeBody
    ): Response<ApiResponse<FoodTypeData>>

    @GET("/food-type/{_id}")
    suspend fun findFoodTypeById(
        @Header("Authorization") authHeader: String,
        @Path("_id") _id: String
    ): Response<ApiResponse<FoodTypeData>>

    @DELETE("/food-type{_id}")
    suspend fun deleteFoodType(
        @Header("Authorization") authHeader: String,
        @Path("_id") _id: String
    ): Response<ApiResponse<FoodTypeData>>
}
