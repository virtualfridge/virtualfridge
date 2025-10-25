package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.NotificationTestResponse
import retrofit2.Response
import retrofit2.http.Header
import retrofit2.http.POST

interface NotificationInterface {
    @POST("notifications/test")
    suspend fun sendTestNotification(
        @Header("Authorization") authHeader: String
    ): Response<ApiResponse<NotificationTestResponse>>
}
