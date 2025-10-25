package com.cpen321.usermanagement.data.remote.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT

data class FridgeItemsResponse(
    val message: String,
    val data: FridgeItemsData?
)

data class FridgeItemsData(
    val fridgeItems: List<FridgeItem>
)

data class FridgeItem(
    val foodItem: FoodItem,
    val foodType: FoodType
)

data class FoodItem(
    val _id: String,
    val userId: String,
    val typeId: String,
    val expirationDate: String?,
    val percentLeft: Int
)

data class FoodType(
    val _id: String,
    val name: String?,
    val brand: String?,
    val quantity: String?,
    val ingredients: String?,
    val image: String?,
    val expiration_date: String?,
    val allergens: List<String>?,
    val nutrients: Nutrients?,
    val shelfLifeDays: Int?
)

data class Nutrients(
    val calories: String?,
    val energy_kj: String?,
    val protein: String?,
    val fat: String?,
    val saturated_fat: String?,
    val monounsaturated_fat: String?,
    val polyunsaturated_fat: String?,
    val trans_fat: String?,
    val cholesterol: String?,
    val carbs: String?,
    val sugars: String?,
    val fiber: String?,
    val salt: String?,
    val sodium: String?,
    val calcium: String?,
    val iron: String?,
    val magnesium: String?,
    val potassium: String?,
    val zinc: String?,
    val caffeine: String?
)

data class UpdateFoodItemRequest(
    val _id: String,
    val expirationDate: String?,
    val percentLeft: Int?
)

data class UpdateFoodItemResponse(
    val message: String,
    val data: UpdateFoodItemData?
)

data class UpdateFoodItemData(
    val foodItem: FoodItem
)

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