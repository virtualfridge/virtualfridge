package com.cpen321.usermanagement.data.remote.dto

data class FoodType(
    val _id: String,
    val name: String,
    val shelfLifeDays: Int,
    val barcodeId: String? = null,
    val nutritionalInfo: NutritionalInfo? = null,
)

data class NutritionalInfo(
    val energy: NutrientInfo? = null,
    val energyKcal: NutrientInfo? = null,
    val energyKj: NutrientInfo? = null,
    val fat: NutrientInfo? = null,
    val saturatedFat: NutrientInfo? = null,
    val transFat: NutrientInfo? = null,
    val cholesterol: NutrientInfo? = null,
    val salt: NutrientInfo? = null,
    val sodium: NutrientInfo? = null,
    val carbohydrates: NutrientInfo? = null,
    val carbohydratesTotal: NutrientInfo? = null,
    val fiber: NutrientInfo? = null,
    val sugars: NutrientInfo? = null,
    val addedSugars: NutrientInfo? = null,
    val proteins: NutrientInfo? = null,
    val vitaminD: NutrientInfo? = null,
    val calcium: NutrientInfo? = null,
    val iron: NutrientInfo? = null,
    val potassium: NutrientInfo? = null,
)

data class NutrientInfo(
    val value: Double,
    val unit: String,
    val perSourceValue: Double,
    val perSourceUnit: String,
)

data class CreateFoodTypeBody(
    val name: String,
    val shelfLifeDays: Int,
    val barcodeId: String? = null,
    val nutritionalInfo: NutritionalInfo? = null,
)

data class UpdateFoodTypeBody(
    val _id: String,
    val name: String? = null,
    val shelfLifeDays: Int? = null,
    val barcodeId: String? = null,
    val nutritionalInfo: NutritionalInfo? = null,
)

data class FoodTypeData(
    val foodType: FoodType,
)
