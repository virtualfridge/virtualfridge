package com.cpen321.usermanagement.ui.viewmodels

import android.net.Uri
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.local.preferences.ThemePreferencesManager
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.data.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    // Loading states
    val isLoadingProfile: Boolean = false,
    val isSavingProfile: Boolean = false,
    val isLoadingPhoto: Boolean = false,

    // Data states
    val user: User? = null,
    val allHobbies: List<String> = emptyList(),
    val selectedHobbies: Set<String> = emptySet(),

    // Message states
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val themePreferencesManager: ThemePreferencesManager
) : ViewModel() {

    companion object {
        private const val TAG = "ProfileViewModel"
    }

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val _isDarkMode = MutableStateFlow(false)
    val isDarkMode: StateFlow<Boolean> = _isDarkMode.asStateFlow()

    init {
        viewModelScope.launch {
            themePreferencesManager.isDarkMode.collect { darkMode ->
                _isDarkMode.value = darkMode
            }
        }
    }

    fun toggleDarkMode() {
        viewModelScope.launch {
            themePreferencesManager.setDarkMode(!_isDarkMode.value)
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingProfile = true, errorMessage = null)

            val profileResult = profileRepository.getProfile()
            val hobbiesResult = profileRepository.getAvailableHobbies()

            if (profileResult.isSuccess && hobbiesResult.isSuccess) {
                val user = profileResult.getOrNull()!!
                val availableHobbies = hobbiesResult.getOrNull()!!
                val selectedHobbies = user.hobbies.toSet()

                _uiState.value = _uiState.value.copy(
                    isLoadingProfile = false,
                    user = user,
                    allHobbies = availableHobbies,
                    selectedHobbies = selectedHobbies
                )
            } else {
                val errorMessage = when {
                    profileResult.isFailure -> {
                        val error = profileResult.exceptionOrNull()
                        Log.e(TAG, "Failed to load profile", error)
                        error?.message ?: "Failed to load profile"
                    }

                    hobbiesResult.isFailure -> {
                        val error = hobbiesResult.exceptionOrNull()
                        Log.e(TAG, "Failed to load hobbies", error)
                        error?.message ?: "Failed to load hobbies"
                    }

                    else -> {
                        Log.e(TAG, "Failed to load data")
                        "Failed to load data"
                    }
                }

                _uiState.value = _uiState.value.copy(
                    isLoadingProfile = false,
                    errorMessage = errorMessage
                )
            }
        }
    }

    fun deleteProfile() {
        viewModelScope.launch {
            val user = _uiState.value.user
            if (user == null) {
                Log.e("ProfileViewModel", "Cannot delete profile: user is null")
                return@launch
            }
            profileRepository.deleteProfile(user)
        }
    }

    fun toggleHobby(hobby: String) {
        val currentSelected = _uiState.value.selectedHobbies.toMutableSet()
        if (currentSelected.contains(hobby)) {
            currentSelected.remove(hobby)
        } else {
            currentSelected.add(hobby)
        }
        _uiState.value = _uiState.value.copy(selectedHobbies = currentSelected)
    }

    fun saveHobbies() {
        viewModelScope.launch {
            val originalHobbies = _uiState.value.user?.hobbies?.toSet() ?: emptySet()

            _uiState.value =
                _uiState.value.copy(
                    isSavingProfile = true,
                    errorMessage = null,
                    successMessage = null
                )

            val selectedHobbiesList = _uiState.value.selectedHobbies.toList()
            val result = profileRepository.updateUserHobbies(selectedHobbiesList)

            if (result.isSuccess) {
                val updatedUser = result.getOrNull()!!
                _uiState.value = _uiState.value.copy(
                    isSavingProfile = false,
                    user = updatedUser,
                    successMessage = "Hobbies updated successfully!"
                )
            } else {
                // Revert to original hobbies on failure
                val error = result.exceptionOrNull()
                Log.d(TAG, "error: $error")
                Log.e(TAG, "Failed to update hobbies", error)
                val errorMessage = error?.message ?: "Failed to update hobbies"

                _uiState.value = _uiState.value.copy(
                    isSavingProfile = false,
                    selectedHobbies = originalHobbies, // Revert the selected hobbies
                    errorMessage = errorMessage
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    fun setLoadingPhoto(isLoading: Boolean) {
        _uiState.value = _uiState.value.copy(isLoadingPhoto = isLoading)
    }

    fun uploadProfilePicture(pictureUri: Uri) {
        val currentUser = _uiState.value.user ?: return
        viewModelScope.launch {
            val imageResult = profileRepository.uploadImage(pictureUri);
            if (imageResult.isSuccess) {
                val result = profileRepository.updateProfile(null, null, imageResult.getOrNull()!!)
                if (result.isSuccess) {
                    val updatedUser = currentUser.copy(profilePicture = pictureUri.toString())
                    _uiState.value = _uiState.value.copy(isLoadingPhoto = false, user= updatedUser, successMessage = "Profile picture updated successfully!")
                } else {
                    val error = result.exceptionOrNull()
                    Log.e(TAG, "Failed to upload photo", error)
                    val errorMessage = error?.message ?: "Failed to update profile"
                    _uiState.value = _uiState.value.copy(
                        isLoadingPhoto = false,
                        errorMessage = errorMessage
                    )
                }
            } else {
                val error = imageResult.exceptionOrNull()
                Log.e(TAG, "Failed to upload photo", error)
                val errorMessage = error?.message ?: "Failed to update profile"
                _uiState.value = _uiState.value.copy(
                    isLoadingPhoto = false,
                    errorMessage = errorMessage
                )
            }
        }
    }

    fun updateProfile(name: String, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            _uiState.value =
                _uiState.value.copy(
                    isSavingProfile = true,
                    errorMessage = null,
                    successMessage = null
                )

            val result = profileRepository.updateProfile(
                name, null,
                orNull = TODO() //not sure why this works
            )
            if (result.isSuccess) {
                val updatedUser = result.getOrNull()!!
                _uiState.value = _uiState.value.copy(
                    isSavingProfile = false,
                    user = updatedUser,
                    successMessage = "Profile updated successfully!"
                )
                onSuccess()
            } else {
                val error = result.exceptionOrNull()
                Log.e(TAG, "Failed to update profile", error)
                val errorMessage = error?.message ?: "Failed to update profile"
                _uiState.value = _uiState.value.copy(
                    isSavingProfile = false,
                    errorMessage = errorMessage
                )
            }
        }
    }
}
