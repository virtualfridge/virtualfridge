package com.cpen321.usermanagement.data.remote.dto

data class NutrientDto(
    val calories: Double?,
    val energy_kj: Double?,
    val protein: Double?,
    val fat: Double?,
    val saturated_fat: Double?,
    val monounsaturated_fat: Double?,
    val polyunsaturated_fat: Double?,
    val trans_fat: Double?,
    val cholesterol: Double?,
    val carbs: Double?,
    val sugars: Double?,
    val fiber: Double?,
    val salt: Double?,
    val sodium: Double?,
    val caffeine: Double?
)

data class MineralDto(
    val calcium: Double?,
    val iron: Double?,
    val magnesium: Double?,
    val potassium: Double?,
    val sodium: Double?,
    val zinc: Double?
)

data class ProductDataDto(
    val name: String?,
    val brand: String?,
    val quantity: String?,
    val ingredients: String?,
    val image: String?,
    val expiration_date: String?,
    val allergens: List<String>?,
    val nutrients: NutrientDto?,
    val minerals: MineralDto?,
    val category_properties: Map<String, String?>?
)
