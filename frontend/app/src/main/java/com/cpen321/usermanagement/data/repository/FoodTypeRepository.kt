package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.FoodType
import com.cpen321.usermanagement.data.remote.dto.NutritionalInfo
import java.util.Date

interface FoodTypeRepository {
    suspend fun createFoodType(
        name: String,
        shelfLifeDays: Int,
        barcodeId: String? = null,
        nutritionalInfo: NutritionalInfo? = null,
    ): Result<FoodType>

    suspend fun updateFoodType(
        _id: String,
        name: String? = null,
        shelfLifeDays: Int? = null,
        barcodeId: String? = null,
        nutritionalInfo: NutritionalInfo? = null,
    ): Result<FoodType>

    suspend fun findFoodTypeById(
        _id: String
    ): Result<FoodType>

    suspend fun deleteFoodType(
        _id: String
    ): Result<Unit>
}