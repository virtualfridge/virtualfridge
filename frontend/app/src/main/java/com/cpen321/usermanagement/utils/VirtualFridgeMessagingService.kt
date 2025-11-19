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

        Log.e(TAG, "🔔 ========== FCM MESSAGE RECEIVED ==========")
        Log.e(TAG, "🔔 Message from: ${message.from}")
        Log.e(TAG, "🔔 Message ID: ${message.messageId}")
        Log.e(TAG, "🔔 Sent time: ${message.sentTime}")

        // Check if message contains a notification payload
        message.notification?.let {
            Log.e(TAG, "🔔 Notification Title: ${it.title}")
            Log.e(TAG, "🔔 Notification Body: ${it.body}")
            Log.e(TAG, "🔔 Calling showNotification()...")
            showNotification(it.title, it.body)
            Log.e(TAG, "🔔 showNotification() completed")
        } ?: Log.e(TAG, "🔔 No notification payload in message")

        // Check if message contains a data payload
        if (message.data.isNotEmpty()) {
            Log.e(TAG, "🔔 Message data payload: ${message.data}")
        } else {
            Log.e(TAG, "🔔 No data payload in message")
        }

        Log.e(TAG, "🔔 ========== END FCM MESSAGE ==========")
    }

    private fun showNotification(title: String?, body: String?) {
        Log.e(TAG, "📱 showNotification() called")
        Log.e(TAG, "📱 Title: $title")
        Log.e(TAG, "📱 Body: $body")

        val channelId = "expiry_notifications"
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        Log.e(TAG, "📱 Got NotificationManager")

        // Create notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.e(TAG, "📱 Creating notification channel for Android O+")
            val channel = NotificationChannel(
                channelId,
                "Food Expiry Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for expiring food items"
            }
            notificationManager.createNotificationChannel(channel)
            Log.e(TAG, "📱 Notification channel created")
        }

        // Build and show notification
        Log.e(TAG, "📱 Building notification...")
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title ?: "Virtual Fridge")
            .setContentText(body ?: "You have a notification")
            .setSmallIcon(R.drawable.ic_account_circle)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        Log.e(TAG, "📱 Notification built, calling notify()...")
        val notificationId = System.currentTimeMillis().toInt()
        Log.e(TAG, "📱 Notification ID: $notificationId")
        notificationManager.notify(notificationId, notification)
        Log.e(TAG, "📱 ✅ notify() called successfully!")
    }

    companion object {
        private const val TAG = "FCMService"
    }
}
