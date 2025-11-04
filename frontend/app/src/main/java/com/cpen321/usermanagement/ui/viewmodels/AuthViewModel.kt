package com.cpen321.usermanagement.ui.viewmodels

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.data.repository.ProfileRepository
import com.cpen321.usermanagement.ui.navigation.NavRoutes
import com.cpen321.usermanagement.ui.navigation.NavigationStateManager
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    // Loading states
    val isSigningIn: Boolean = false,
    val isSigningUp: Boolean = false,
    val isCheckingAuth: Boolean = true,

    // Auth states
    val isAuthenticated: Boolean = false,
    val user: User? = null,

    // Message states
    val errorMessage: String? = null,
    val successMessage: String? = null,

    // Control flags
    val shouldSkipAuthCheck: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val profileRepository: ProfileRepository,
    private val navigationStateManager: NavigationStateManager
) : ViewModel() {

    companion object {
        private const val TAG = "AuthViewModel"
    }

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        if (!_uiState.value.shouldSkipAuthCheck) {
            checkAuthenticationStatus()
        }
    }

    private fun checkAuthenticationStatus() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingAuth = true)
            updateNavigationState(isLoading = true)
            authenticateUser()
        }
    }

    private suspend fun authenticateUser() {
        try {
            val isAuthenticated = authRepository.isUserAuthenticated()
            val user = if (isAuthenticated) authRepository.getCurrentUser() else null
            processAuthenticationResult(isAuthenticated, user)
        } catch (e: java.net.SocketTimeoutException) {
            handleAuthError("Network timeout. Please check your connection.", e)
        } catch (e: java.net.UnknownHostException) {
            handleAuthError("No internet connection. Please check your network.", e)
        } catch (e: java.io.IOException) {
            handleAuthError("Connection error. Please try again.", e)
        }
    }

    private fun processAuthenticationResult(isAuthenticated: Boolean, user: User?) {
        val needsProfileCompletion = user?.bio == null || user.bio.isBlank()

        _uiState.value = _uiState.value.copy(
            isAuthenticated = isAuthenticated,
            user = user,
            isCheckingAuth = false
        )

        updateNavigationState(
            isAuthenticated = isAuthenticated,
            needsProfileCompletion = needsProfileCompletion,
            isLoading = false
        )
    }

    private fun updateNavigationState(
        isAuthenticated: Boolean = false,
        needsProfileCompletion: Boolean = false,
        isLoading: Boolean = false
    ) {
        navigationStateManager.updateAuthenticationState(
            isAuthenticated = isAuthenticated,
            needsProfileCompletion = needsProfileCompletion,
            isLoading = isLoading,
            currentRoute = NavRoutes.LOADING
        )
    }

    private fun handleAuthError(errorMessage: String, exception: Exception) {
        Log.e(TAG, "Authentication check failed: $errorMessage", exception)
        _uiState.value = _uiState.value.copy(
            isCheckingAuth = false,
            isAuthenticated = false,
            errorMessage = errorMessage
        )
        updateNavigationState()
    }

    suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential> {
        return authRepository.signInWithGoogle(context)
    }

    private fun handleGoogleAuthResult(
        credential: GoogleIdTokenCredential,
        isSignUp: Boolean,
        authOperation: suspend (String) -> Result<AuthData>
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isSigningIn = !isSignUp,
                isSigningUp = isSignUp
            )

            authOperation(credential.idToken)
                .onSuccess { authData ->
                    onGoogleAuthSuccess(authData)
                }
                .onFailure { error ->
                    onGoogleAuthFailure(error, isSignUp)
                }
        }
    }

    private fun onGoogleAuthSuccess(authData: AuthData) {
        val needsProfileCompletion =
            authData.user.bio == null || authData.user.bio.isBlank()

        _uiState.value = _uiState.value.copy(
            isSigningIn = false,
            isSigningUp = false,
            isAuthenticated = true,
            user = authData.user,
            errorMessage = null
        )

        navigationStateManager.updateAuthenticationState(
            isAuthenticated = true,
            needsProfileCompletion = needsProfileCompletion,
            isLoading = false,
            currentRoute = NavRoutes.AUTH
        )
    }

    private fun onGoogleAuthFailure(error: Throwable, isSignUp: Boolean) {
        val operationType = if (isSignUp) "sign up" else "sign in"
        Log.e(TAG, "Google $operationType failed", error)
        _uiState.value = _uiState.value.copy(
            isSigningIn = false,
            isSigningUp = false,
            errorMessage = error.message
        )
    }

    fun handleGoogleSignInResult(credential: GoogleIdTokenCredential) {
        handleGoogleAuthResult(credential, isSignUp = false) { idToken ->
            authRepository.googleSignIn(idToken)
        }
    }

    fun handleGoogleSignUpResult(credential: GoogleIdTokenCredential) {
        handleGoogleAuthResult(credential, isSignUp = true) { idToken ->
            authRepository.googleSignUp(idToken)
        }
    }

    fun handleSignOut() {
        viewModelScope.launch {
            authRepository.clearToken()
            _uiState.value = AuthUiState(
                isAuthenticated = false,
                isCheckingAuth = false,
                shouldSkipAuthCheck = true // Skip auth check after manual sign out
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun setSuccessMessage(message: String) {
        _uiState.value = _uiState.value.copy(successMessage = message)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    fun registerFcmToken(fcmToken: String) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Registering FCM token: $fcmToken")
                profileRepository.updateFcmToken(fcmToken)
                    .onSuccess {
                        Log.d(TAG, "FCM token registered successfully")
                    }
                    .onFailure { error ->
                        Log.e(TAG, "Failed to register FCM token", error)
                    }
            } catch (e: Exception) {
                Log.e(TAG, "Error registering FCM token", e)
            }
        }
    }
}
