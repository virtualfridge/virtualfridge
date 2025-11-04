package com.cpen321.usermanagement

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.cpen321.usermanagement.data.local.preferences.ThemePreferencesManager
import com.cpen321.usermanagement.ui.navigation.AppNavigation
import com.cpen321.usermanagement.ui.theme.ProvideFontSizes
import com.cpen321.usermanagement.ui.theme.ProvideSpacing
import com.cpen321.usermanagement.ui.theme.UserManagementTheme
import com.cpen321.usermanagement.ui.viewmodels.AuthViewModel
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import android.app.Activity
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext


@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()

    @Inject
    lateinit var themePreferencesManager: ThemePreferencesManager

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d(TAG, "Notification permission granted")
        } else {
            Log.d(TAG, "Notification permission denied")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Request notification permission first
        requestNotificationPermission()

        // Observe authentication state and register token when user is authenticated
        lifecycleScope.launch {
            authViewModel.uiState.collect { state ->
                if (state.isAuthenticated && !tokenRegistered) {
                    getFcmToken()
                }
            }
        }

        setContent {
            val isDarkMode by themePreferencesManager.isDarkMode.collectAsState(initial = false)

            UserManagementTheme(darkTheme = isDarkMode) {
                val context = LocalContext.current
                val activity = context as? Activity

                LaunchedEffect(Unit) {
                    activity?.reportFullyDrawn()
                }

                UserManagementApp()
            }
        }
    }

    private var tokenRegistered = false

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun getFcmToken() {
        // Check if notification permission is granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Notification permission not granted, skipping FCM token registration")
                return
            }
        }

        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }

            val token = task.result
            Log.d(TAG, "FCM Token: $token")
            tokenRegistered = true
            authViewModel.registerFcmToken(token)
        }
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}

@Composable
fun UserManagementApp() {
    ProvideSpacing {
        ProvideFontSizes {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                AppNavigation()
            }
        }
    }
}