package com.cpen321.usermanagement.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.cpen321.usermanagement.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class VirtualFridgeMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        // Token is automatically sent to backend via AuthViewModel
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        Log.d(TAG, "Message received from: ${message.from}")

        // Check if message contains a notification payload
        message.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            showNotification(it.title, it.body)
        }

        // Check if message contains a data payload
        if (message.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${message.data}")
        }
    }

    private fun showNotification(title: String?, body: String?) {
        val channelId = "expiry_notifications"
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Food Expiry Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for expiring food items"
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Build and show notification
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title ?: "Virtual Fridge")
            .setContentText(body ?: "You have a notification")
            .setSmallIcon(R.drawable.ic_account_circle) // You may want to use a different icon
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    companion object {
        private const val TAG = "FCMService"
    }
}
