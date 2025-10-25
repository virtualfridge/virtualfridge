package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.api.NotificationInterface
import com.cpen321.usermanagement.data.remote.dto.NotificationTestResponse
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val notificationInterface: NotificationInterface
) : NotificationRepository {

    companion object {
        private const val TAG = "NotificationRepositoryImpl"
    }

    override suspend fun sendTestNotification(): Result<NotificationTestResponse> {
        return try {
            val response = notificationInterface.sendTestNotification("") // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                Log.d(TAG, "Successfully sent test notification")
                Result.success(response.body()!!.data!!)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to send test notification.")
                Log.e(TAG, "Failed to send test notification: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while sending test notification", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while sending test notification", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while sending test notification", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while sending test notification: ${e.code()}", e)
            Result.failure(e)
        }
    }
}
