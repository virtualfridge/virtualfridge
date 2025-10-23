// BarcodeRepository.kt
package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.ProductDataDto

interface BarcodeRepository {
    suspend fun sendBarcode(barcode: String): Result<FoodType>
}
