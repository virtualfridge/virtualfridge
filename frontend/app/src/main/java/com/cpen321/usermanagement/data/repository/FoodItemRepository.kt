package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.FoodItem
import java.util.Date

interface FoodItemRepository {
    // TODO: we might want to refactor this method into add with barcode and add with image
    suspend fun createFoodItem(
        typeId: String,
        barcodeId: String? = null,
        expirationDate: Date,
        percentLeft: Double,
    ): Result<FoodItem>

    suspend fun updateFoodItem(
        _id: String,
        userId: String? = null,
        expirationDate: String? = null,
        percentLeft: Double? = null,
    ): Result<FoodItem>

    suspend fun findFoodItemById(
        _id: String
    ): Result<FoodItem>

    suspend fun deleteFoodItem(
        _id: String
    ): Result<Unit>
}