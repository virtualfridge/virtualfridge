package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.dto.NotificationTestResponse

interface NotificationRepository {
    suspend fun sendTestNotification(): Result<NotificationTestResponse>
}
