package com.cpen321.usermanagement.data.remote.dto

data class NotificationTestResponse(
    val expiringItemsCount: Int,
    val expiringItems: List<ExpiringItem>
)

data class ExpiringItem(
    val name: String,
    val expirationDate: String
)

data class NotificationCheckResponse(
    val message: String,
    val itemsExpiring: Int,
    val notificationSent: Boolean
)
