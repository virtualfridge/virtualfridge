package com.cpen321.usermanagement.ui.screens

import Button
import Icon
import android.net.Uri
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.ui.components.ImagePicker
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.viewmodels.ProfileUiState
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import androidx.core.net.toUri

private data class ProfileFormState(
    val name: String = "",
    val email: String = "",
//    val bio: String = "",
    val originalName: String = "",
    val originalBio: String = ""
) {
    fun hasChanges(): Boolean {
        return (name.isNotBlank() && name != originalName)
//              ||  (bio != originalBio && bio.isNotBlank())
    }
}

private data class ManageProfileScreenActions(
    val onBackClick: () -> Unit,
    val onNameChange: (String) -> Unit,
//    val onBioChange: (String) -> Unit,
    val onEditPictureClick: () -> Unit,
    val onSaveClick: () -> Unit,
    val onImagePickerDismiss: () -> Unit,
    val onImageSelected: (Uri) -> Unit,
    val onLoadingPhotoChange: (Boolean) -> Unit,
    val onSuccessMessageShown: () -> Unit,
    val onErrorMessageShown: () -> Unit
)

private data class ProfileFormData(
    val user: User,
    val formState: ProfileFormState,
    val isLoadingPhoto: Boolean,
    val isSavingProfile: Boolean,
    val onNameChange: (String) -> Unit,
//    val onBioChange: (String) -> Unit,
    val onEditPictureClick: () -> Unit,
    val onSaveClick: () -> Unit,
    val onLoadingPhotoChange: (Boolean) -> Unit
)

private data class ProfileBodyData(
    val uiState: ProfileUiState,
    val formState: ProfileFormState,
    val onNameChange: (String) -> Unit,
//    val onBioChange: (String) -> Unit,
    val onEditPictureClick: () -> Unit,
    val onSaveClick: () -> Unit,
    val onLoadingPhotoChange: (Boolean) -> Unit
)

private data class ProfileFieldsData(
    val name: String,
    val email: String,
//    val bio: String,
    val onNameChange: (String) -> Unit,
//    val onBioChange: (String) -> Unit
)

@Composable
fun ManageProfileScreen(
    profileViewModel: ProfileViewModel,
    onBackClick: () -> Unit
) {
    val uiState by profileViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }

    var showImagePickerDialog by remember { mutableStateOf(false) }

    // Form state
    var formState by remember {
        mutableStateOf(ProfileFormState())
    }

    // Side effects
    LaunchedEffect(Unit) {
        profileViewModel.clearSuccessMessage()
        profileViewModel.clearError()
        if (uiState.user == null) {
            profileViewModel.loadProfile()
        }
    }

    LaunchedEffect(uiState.user) {
        uiState.user?.let { user ->
            formState = ProfileFormState(
                name = user.name,
                email = user.email,
//                bio = user.bio ?: "",
                originalName = user.name,
                originalBio = user.bio ?: ""
            )
        }
    }

    val actions = ManageProfileScreenActions(
        onBackClick = onBackClick,
        onNameChange = { formState = formState.copy(name = it) },

        onEditPictureClick = { showImagePickerDialog = true },
        onSaveClick = {
            profileViewModel.updateProfile(formState.name)
        },
        onImagePickerDismiss = { showImagePickerDialog = false },
        onImageSelected = { uri ->
            showImagePickerDialog = false
            profileViewModel.uploadProfilePicture(uri)
        },
        onLoadingPhotoChange = profileViewModel::setLoadingPhoto,
        onSuccessMessageShown = profileViewModel::clearSuccessMessage,
        onErrorMessageShown = profileViewModel::clearError
    )

    ManageProfileContent(
        uiState = uiState,
        formState = formState,
        snackBarHostState = snackBarHostState,
        showImagePickerDialog = showImagePickerDialog,
        actions = actions
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ManageProfileContent(
    uiState: ProfileUiState,
    formState: ProfileFormState,
    snackBarHostState: SnackbarHostState,
    showImagePickerDialog: Boolean,
    actions: ManageProfileScreenActions,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            ProfileTopBar(onBackClick = actions.onBackClick)
        },
        snackbarHost = {
            MessageSnackbar(
                hostState = snackBarHostState,
                messageState = MessageSnackbarState(
                    successMessage = uiState.successMessage,
                    errorMessage = uiState.errorMessage,
                    onSuccessMessageShown = actions.onSuccessMessageShown,
                    onErrorMessageShown = actions.onErrorMessageShown
                )
            )
        }
    ) { paddingValues ->
        ProfileBody(
            paddingValues = paddingValues,
            data = ProfileBodyData(
                uiState = uiState,
                formState = formState,
                onNameChange = actions.onNameChange,
//                onBioChange = actions.onBioChange,
                onEditPictureClick = actions.onEditPictureClick,
                onSaveClick = actions.onSaveClick,
                onLoadingPhotoChange = actions.onLoadingPhotoChange
            )
        )
    }

    if (showImagePickerDialog) {
        ImagePicker(
            onDismiss = actions.onImagePickerDismiss,
            onImageSelected = actions.onImageSelected
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = stringResource(R.string.manage_profile),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Medium
            )
        },
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(name = R.drawable.ic_arrow_back)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
private fun ProfileBody(
    paddingValues: PaddingValues,
    data: ProfileBodyData,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
    ) {
        when {
            data.uiState.isLoadingProfile -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }

            data.uiState.user != null -> {
                ProfileForm(
                    data = ProfileFormData(
                        user = data.uiState.user,
                        formState = data.formState,
                        isLoadingPhoto = data.uiState.isLoadingPhoto,
                        isSavingProfile = data.uiState.isSavingProfile,
                        onNameChange = data.onNameChange,
//                        onBioChange = data.onBioChange,
                        onEditPictureClick = data.onEditPictureClick,
                        onSaveClick = data.onSaveClick,
                        onLoadingPhotoChange = data.onLoadingPhotoChange
                    )
                )
            }
        }
    }
}

@Composable
private fun ProfileForm(
    data: ProfileFormData,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(spacing.large)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(spacing.large)
    ) {
        ProfilePictureCard(
            profilePicture = data.user.profilePicture,
            isLoadingPhoto = data.isLoadingPhoto,
            onEditClick = data.onEditPictureClick,
            onLoadingChange = data.onLoadingPhotoChange
        )

        ProfileFields(
            data = ProfileFieldsData(
                name = data.formState.name,
                email = data.user.email,
//                bio = data.formState.bio,
                onNameChange = data.onNameChange,
//                onBioChange = data.onBioChange
            )
        )

        SaveButton(
            isSaving = data.isSavingProfile,
            isEnabled = data.formState.hasChanges(),
            onClick = data.onSaveClick
        )
    }
}

@Composable
private fun ProfilePictureCard(
    profilePicture: String,
    isLoadingPhoto: Boolean,
    onEditClick: () -> Unit,
    onLoadingChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(spacing.extraLarge),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ProfilePictureWithEdit(
                profilePicture = profilePicture,
                isLoadingPhoto = isLoadingPhoto,
                onEditClick = onEditClick,
                onLoadingChange = onLoadingChange
            )
        }
    }
}

@Composable
private fun ProfilePictureWithEdit(
    profilePicture: String,
    isLoadingPhoto: Boolean,
    onEditClick: () -> Unit,
    onLoadingChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    val uri = RetrofitClient.getPictureUri(profilePicture).toUri();
    Log.e("DEBUG",uri.toString())
    Box(
        modifier = modifier.size(spacing.extraLarge5)
    ) {
        AsyncImage(
            model = RetrofitClient.getPictureUri(profilePicture).toUri(),
            onLoading = { onLoadingChange(true) },
            onSuccess = { onLoadingChange(false) },
            onError = {
                Log.e("DEBUG","Could not load image $profilePicture")
                onLoadingChange(false) },
            contentDescription = stringResource(R.string.profile_picture),
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
        )

        if (isLoadingPhoto) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(spacing.large),
                    color = MaterialTheme.colorScheme.primary,
                    strokeWidth = 2.dp
                )
            }
        }

        IconButton(
            onClick = onEditClick,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .size(spacing.extraLarge)
                .background(
                    color = MaterialTheme.colorScheme.primary,
                    shape = CircleShape
                )
        ) {
            Icon(
                name = R.drawable.ic_edit,
                type = "light"
            )
        }
    }
}

@Composable
private fun ProfileFields(
    data: ProfileFieldsData,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        OutlinedTextField(
            value = data.name,
            onValueChange = data.onNameChange,
            label = { Text(stringResource(R.string.name)) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = data.email,
            onValueChange = { /* Read-only */ },
            label = { Text(stringResource(R.string.email)) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = false
        )

//        Row(Modifier.focusProperties { canFocus = true }) {
//            OutlinedTextField(
////                value = data.bio,
////                onValueChange = data.onBioChange,
////                label = { Text(stringResource(R.string.bio)) },
////                placeholder = { Text(stringResource(R.string.bio_placeholder)) },
//                modifier = Modifier.fillMaxWidth(),
//                minLines = 3,
//                maxLines = 5,
////                value = TODO(),
////                onValueChange = TODO(),
//            )
//        }
    }
}

@Composable
private fun SaveButton(
    isSaving: Boolean,
    isEnabled: Boolean,
    onClick: () -> Unit,
) {
    val spacing = LocalSpacing.current

    Button(
        onClick = onClick,
        enabled = !isSaving && isEnabled,
    ) {
        if (isSaving) {
            CircularProgressIndicator(
                modifier = Modifier.size(spacing.medium),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.height(spacing.small))
        }
        Text(
            text = stringResource(if (isSaving) R.string.saving else R.string.save),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )
    }
}