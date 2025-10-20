// BarcodeRepository.kt
package com.cpen321.usermanagement.data.repository

interface BarcodeRepository {
    suspend fun sendBarcode(barcode: String): Result<Unit>
}
