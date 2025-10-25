package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.FridgeItem

interface FridgeRepository {
    suspend fun getFridgeItems(): Result<List<FridgeItem>>
    suspend fun updateFoodItem(foodItemId: String, percentLeft: Int): Result<Unit>
    suspend fun sendBarcode(barcode: String): Result<FridgeItem>
}

