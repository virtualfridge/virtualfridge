package com.cpen321.usermanagement.data.remote.dto

data class FridgeItemData(
    val fridgeItem: FridgeItem
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

data class BarcodeRequest(
    val barcode: String
)

data class UpdateFoodItemRequest(
    val _id: String,
    val expirationDate: String?,
    val percentLeft: Int?
)

data class FoodItemData(
    val foodItem: FoodItem
)
