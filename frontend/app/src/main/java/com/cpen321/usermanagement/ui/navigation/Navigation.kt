package com.cpen321.usermanagement.ui.navigation

import android.util.Log
import androidx.compose.runtime.*
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.screens.*
import com.cpen321.usermanagement.ui.viewmodels.*

object NavRoutes {
    const val LOADING = "loading"
    const val AUTH = "auth"
    const val MAIN = "main"
    const val PROFILE = "profile"
    const val MANAGE_PROFILE = "manage_profile"
    const val PROFILE_COMPLETION = "profile_completion"
    const val SCANNER = "scanner"
    const val RECIPE = "recipe"
    const val BARCODE_RESULT = "barcode_result"
    const val FRIDGE = "fridge"
}

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController()
) {
    val navigationViewModel: NavigationViewModel = hiltViewModel()
    val navigationStateManager = navigationViewModel.navigationStateManager
    val navigationEvent by navigationStateManager.navigationEvent.collectAsState()

    // Initialize view models required for navigation-level scope
    val authViewModel: AuthViewModel = hiltViewModel()
    val profileViewModel: ProfileViewModel = hiltViewModel()
    val mainViewModel: MainViewModel = hiltViewModel()

    // Handle navigation events
    LaunchedEffect(navigationEvent) {
        handleNavigationEvent(
            navigationEvent,
            navController,
            navigationStateManager,
            authViewModel,
            mainViewModel
        )
    }

    AppNavHost(
        navController = navController,
        authViewModel = authViewModel,
        profileViewModel = profileViewModel,
        mainViewModel = mainViewModel,
        navigationStateManager = navigationStateManager
    )
}

private fun handleNavigationEvent(
    navigationEvent: NavigationEvent,
    navController: NavHostController,
    navigationStateManager: NavigationStateManager,
    authViewModel: AuthViewModel,
    mainViewModel: MainViewModel
) {
    when (navigationEvent) {
        is NavigationEvent.NavigateToAuth -> {
            navController.navigate(NavRoutes.AUTH) { popUpTo(0) { inclusive = true } }
        }
        is NavigationEvent.NavigateToAuthWithMessage -> {
            authViewModel.setSuccessMessage(navigationEvent.message)
            navController.navigate(NavRoutes.AUTH) { popUpTo(0) { inclusive = true } }
        }
        is NavigationEvent.NavigateToMain -> {
            navController.navigate(NavRoutes.MAIN) { popUpTo(0) { inclusive = true } }
        }
        is NavigationEvent.NavigateToMainWithMessage -> {
            mainViewModel.setSuccessMessage(navigationEvent.message)
            navController.navigate(NavRoutes.MAIN) { popUpTo(0) { inclusive = true } }
        }
//        is NavigationEvent.NavigateToProfileCompletion -> {
//            navController.navigate(NavRoutes.PROFILE_COMPLETION) { popUpTo(0) { inclusive = true } }
//        }
        is NavigationEvent.NavigateToProfile -> navController.navigate(NavRoutes.PROFILE)
        is NavigationEvent.NavigateToManageProfile -> navController.navigate(NavRoutes.MANAGE_PROFILE)
        is NavigationEvent.NavigateToScanner -> navController.navigate(NavRoutes.SCANNER)
        is NavigationEvent.NavigateToRecipe -> navController.navigate(NavRoutes.RECIPE)
        is NavigationEvent.NavigateToBarcodeResult -> navController.navigate(NavRoutes.BARCODE_RESULT)
        is NavigationEvent.NavigateToFridge -> navController.navigate(NavRoutes.FRIDGE)
        is NavigationEvent.NavigateBack -> navController.popBackStack()
        is NavigationEvent.ClearBackStack -> navController.popBackStack(navController.graph.startDestinationId, false)
        is NavigationEvent.NoNavigation -> { /* do nothing */ }
    }
    navigationStateManager.clearNavigationEvent()
}

/*
 * Rationale for suppression:
 * - This function declares the app's navigation graph using Compose's DSL.
 * - The length comes from multiple route blocks and inline lambdas, not complex logic.
 * - Splitting each destination into separate functions would add indirection and
 *   scatter closely related navigation wiring, reducing cohesion.
 * - Keeping it inline makes the graph easy to scan and update as a whole.
 */
@Suppress("LongMethod", "ComplexMethod")
@Composable
private fun AppNavHost(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    profileViewModel: ProfileViewModel,
    mainViewModel: MainViewModel,
    navigationStateManager: NavigationStateManager
) {
    NavHost(navController = navController, startDestination = NavRoutes.LOADING) {
        composable(NavRoutes.LOADING) {
            LoadingScreen(message = stringResource(R.string.checking_authentication))
        }

        composable(NavRoutes.AUTH) {
            AuthScreen(authViewModel = authViewModel, profileViewModel = profileViewModel)
        }

//        composable(NavRoutes.PROFILE_COMPLETION) {
////            ProfileCompletionScreen(
////                profileViewModel = profileViewModel,
////                onProfileCompleted = { navigationStateManager.handleProfileCompletion() },
////                onProfileCompletedWithMessage = { message ->
////                    Log.d("AppNavigation", "Profile completed with message: $message")
////                    navigationStateManager.handleProfileCompletionWithMessage(message)
////                }
////            )
//        }

        composable(NavRoutes.MAIN) {
            MainScreen(
                mainViewModel = mainViewModel,
                fridgeViewModel = hiltViewModel(),
                onProfileClick = { navigationStateManager.navigateToProfile() },
                onRecipeClick = { navigationStateManager.navigateToRecipe() },
                onBarcodeResultClick = { navigationStateManager.navigateToBarcodeResult() },
                onFridgeClick = { navigationStateManager.navigateToFridge() }
            )
        }

        composable(NavRoutes.PROFILE) {
            ProfileScreen(
                authViewModel = authViewModel,
                profileViewModel = profileViewModel,
                actions = ProfileScreenActions(
                    onBackClick = { navigationStateManager.navigateBack() },
                    onManageProfileClick = { navigationStateManager.navigateToManageProfile() },
                    onAccountDeleted = { navigationStateManager.handleAccountDeletion() },
                    onSignOut = { navigationStateManager.handleSignOut()},
                )
            )
        }

        composable(NavRoutes.MANAGE_PROFILE) {
            ManageProfileScreen(
                profileViewModel = profileViewModel,
                onBackClick = { navigationStateManager.navigateBack() }
            )
        }

        // Placeholder for scanner screen; implement separately
        composable(NavRoutes.SCANNER) {
        }

        composable(NavRoutes.RECIPE) {
            RecipeScreen(
                mainViewModel = mainViewModel,
                onBackClick = { navigationStateManager.navigateBack() }
            )
        }


        composable(NavRoutes.BARCODE_RESULT) {
            BarcodeResultScreen(
                mainViewModel = mainViewModel,
                onBackClick = { 
                    mainViewModel.clearBarcodeResult()
                    navigationStateManager.navigateBack() 
                }
            )
        }

        composable(NavRoutes.FRIDGE) {
            FridgeScreen(
                fridgeViewModel = hiltViewModel(),
                onBackClick = { navigationStateManager.navigateBack() }
            )
        }
    }
}
