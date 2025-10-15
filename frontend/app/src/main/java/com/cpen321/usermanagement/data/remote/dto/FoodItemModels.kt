package com.cpen321.usermanagement.data.remote.dto

data class FoodItem(
    val _id: String,
    val userId: String,
    val typeId: String,
    val barcodeId: String? = null,
    val expirationDate: String,
    val percentLeft: Double,
)

data class CreateFoodItemBody(
    val userId: String,
    val typeId: String,
    val barcodeId: String? = null,
    val expirationDate: String? = null,
    val percentLeft: Double,
)
data class UpdateFoodItemBody(
    val _id: String,
    val userId: String? = null,
    val expirationDate: String? = null,
    val percentLeft: Double? = null,
)

data class FoodItemData(
    val foodItem: FoodItem,
)