package com.cpen321.usermanagement.ui.navigation

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

sealed class NavigationEvent {
    object NavigateToAuth : NavigationEvent()
    object NavigateToMain : NavigationEvent()
//    object NavigateToProfileCompletion : NavigationEvent()
    object NavigateToProfile : NavigationEvent()
    object NavigateToManageProfile : NavigationEvent()
//    object NavigateToManageHobbies : NavigationEvent()
    data class NavigateToAuthWithMessage(val message: String) : NavigationEvent()
    data class NavigateToMainWithMessage(val message: String) : NavigationEvent()
    object NavigateToScanner : NavigationEvent()
    object NavigateToRecipe : NavigationEvent()
    object NavigateBack : NavigationEvent()
    object ClearBackStack : NavigationEvent()
    object NoNavigation : NavigationEvent()
}

data class NavigationState(
    val currentRoute: String = NavRoutes.LOADING,
    val isAuthenticated: Boolean = false,
    val needsProfileCompletion: Boolean = false,
    val isLoading: Boolean = true,
    val isNavigating: Boolean = false
)

@Singleton
class NavigationStateManager @Inject constructor() {

    private val _navigationEvent = MutableStateFlow<NavigationEvent>(NavigationEvent.NoNavigation)
    val navigationEvent: StateFlow<NavigationEvent> = _navigationEvent.asStateFlow()

    private val _navigationState = MutableStateFlow(NavigationState())

    fun updateAuthenticationState(
        isAuthenticated: Boolean,
        needsProfileCompletion: Boolean,
        isLoading: Boolean = false,
        currentRoute: String = _navigationState.value.currentRoute
    ) {
        _navigationState.value = _navigationState.value.copy(
            isAuthenticated = isAuthenticated,
            needsProfileCompletion = needsProfileCompletion,
            isLoading = isLoading,
            currentRoute = currentRoute
        )

        if (!isLoading) {
            handleAuthenticationNavigation(currentRoute, isAuthenticated, needsProfileCompletion)
        }
    }

    private fun handleAuthenticationNavigation(
        currentRoute: String,
        isAuthenticated: Boolean,
        needsProfileCompletion: Boolean
    ) {
        when {
            currentRoute == NavRoutes.LOADING -> {
                when {
                    isAuthenticated -> navigateToMain()
                    else -> navigateToAuth()
                }
            }
            currentRoute.startsWith(NavRoutes.AUTH) && isAuthenticated -> {
                navigateToMain()
            }
        }
    }

    fun navigateToAuth() {
        _navigationEvent.value = NavigationEvent.NavigateToAuth
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.AUTH)
    }

    fun navigateToAuthWithMessage(message: String) {
        _navigationEvent.value = NavigationEvent.NavigateToAuthWithMessage(message)
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.AUTH)
    }

    fun navigateToMain() {
        _navigationEvent.value = NavigationEvent.NavigateToMain
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.MAIN)
    }

    fun navigateToMainWithMessage(message: String) {
        _navigationEvent.value = NavigationEvent.NavigateToMainWithMessage(message)
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.MAIN)
    }

//    fun navigateToProfileCompletion() {
//        _navigationEvent.value = NavigationEvent.NavigateToProfileCompletion
//        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.PROFILE_COMPLETION)
//    }

    fun navigateToProfile() {
        _navigationEvent.value = NavigationEvent.NavigateToProfile
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.PROFILE)
    }

    fun navigateToManageProfile() {
        _navigationEvent.value = NavigationEvent.NavigateToManageProfile
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.MANAGE_PROFILE)
    }

    fun navigateToRecipe() {
        _navigationEvent.value = NavigationEvent.NavigateToRecipe
        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.RECIPE)
    }

//    fun navigateToManageHobbies() {
//        _navigationEvent.value = NavigationEvent.NavigateToManageHobbies
//        _navigationState.value = _navigationState.value.copy(currentRoute = NavRoutes.MANAGE_HOBBIES)
//    }

    fun navigateToScanner() {
        _navigationEvent.value = NavigationEvent.NavigateToScanner
    }

    fun navigateBack() {
        _navigationEvent.value = NavigationEvent.NavigateBack
    }

    fun handleAccountDeletion() {
        _navigationState.value = _navigationState.value.copy(isNavigating = true)
        updateAuthenticationState(
            isAuthenticated = false,
            needsProfileCompletion = false,
            isLoading = false
        )
        navigateToAuthWithMessage("Account deleted successfully!")
    }

    fun handleProfileCompletion() {
        _navigationState.value = _navigationState.value.copy(needsProfileCompletion = false)
        navigateToMain()
    }

    fun handleProfileCompletionWithMessage(message: String) {
        _navigationState.value = _navigationState.value.copy(needsProfileCompletion = false)
        navigateToMainWithMessage(message)
    }

    fun clearNavigationEvent() {
        _navigationEvent.value = NavigationEvent.NoNavigation
        _navigationState.value = _navigationState.value.copy(isNavigating = false)
    }
}
