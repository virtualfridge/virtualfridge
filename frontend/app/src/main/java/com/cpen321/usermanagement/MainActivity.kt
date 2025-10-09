package com.cpen321.usermanagement

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.ui.navigation.AppNavigation
import com.cpen321.usermanagement.ui.screens.MainScreen
import com.cpen321.usermanagement.ui.theme.ProvideFontSizes
import com.cpen321.usermanagement.ui.theme.ProvideSpacing
import com.cpen321.usermanagement.ui.theme.UserManagementTheme
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            UserManagementTheme {
                ProvideSpacing {
                    ProvideFontSizes {
                        // Obtain the MainViewModel via Hilt
                        val mainViewModel: MainViewModel = hiltViewModel()

                        // Show MainScreen
                        MainScreen(
                            mainViewModel = mainViewModel,
                            onProfileClick = {
                                // Handle profile click navigation here
                            }
                        )
                    }
                }
            }
        }
    }
}
