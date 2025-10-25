package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

data class BarcodeRequest(
    val barcode: String
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

data class BarcodeResponse(
    val success: Boolean,
    val response: BarcodeResultData
)

data class BarcodeResultData(
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

interface BarcodeInterface {
    @POST("barcode")
    suspend fun sendBarcode(
        @Header("Authorization") authHeader: String,
        @Body request: BarcodeRequest,
    ): Response<BarcodeResponse>
}

