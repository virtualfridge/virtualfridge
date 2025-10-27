package com.cpen321.usermanagement.ui.screens

import Button
import Icon
import MenuButtonItem
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.viewmodels.AuthViewModel
import com.cpen321.usermanagement.ui.viewmodels.ProfileUiState
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel
import com.cpen321.usermanagement.ui.theme.LocalSpacing

private data class ProfileDialogState(
    val showDeleteDialog: Boolean = false
)

data class ProfileScreenActions(
    val onBackClick: () -> Unit,
    val onManageProfileClick: () -> Unit,
//    val onManageHobbiesClick: () -> Unit,
    val onAccountDeleted: () -> Unit
)

private data class ProfileScreenCallbacks(
    val onBackClick: () -> Unit,
    val onManageProfileClick: () -> Unit,
//    val onManageHobbiesClick: () -> Unit,
    val onDeleteAccountClick: () -> Unit,
    val onDeleteDialogDismiss: () -> Unit,
    val onDeleteDialogConfirm: () -> Unit,
    val onSuccessMessageShown: () -> Unit,
    val onErrorMessageShown: () -> Unit,
    val onDarkModeToggle: () -> Unit = {}
)

@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel,
    profileViewModel: ProfileViewModel,
    actions: ProfileScreenActions
) {
    val uiState by profileViewModel.uiState.collectAsState()
    val isDarkMode by profileViewModel.isDarkMode.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }

    // Dialog state
    var dialogState by remember {
        mutableStateOf(ProfileDialogState())
    }

    // Side effects
    LaunchedEffect(Unit) {
        profileViewModel.clearSuccessMessage()
        profileViewModel.clearError()
    }

    ProfileContent(
        uiState = uiState,
        dialogState = dialogState,
        isDarkMode = isDarkMode,
        snackBarHostState = snackBarHostState,
        callbacks = ProfileScreenCallbacks(
            onBackClick = actions.onBackClick,
            onManageProfileClick = actions.onManageProfileClick,
//            onManageHobbiesClick = actions.onManageHobbiesClick,
            onDeleteAccountClick = {
                dialogState = dialogState.copy(showDeleteDialog = true)
            },
            onDeleteDialogDismiss = {
                dialogState = dialogState.copy(showDeleteDialog = false)
            },
            onDeleteDialogConfirm = {
                dialogState = dialogState.copy(showDeleteDialog = false)
                profileViewModel.deleteProfile()
                actions.onAccountDeleted()
            },
            onSuccessMessageShown = profileViewModel::clearSuccessMessage,
            onErrorMessageShown = profileViewModel::clearError,
            onDarkModeToggle = profileViewModel::toggleDarkMode
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileContent(
    uiState: ProfileUiState,
    dialogState: ProfileDialogState,
    isDarkMode: Boolean,
    snackBarHostState: SnackbarHostState,
    callbacks: ProfileScreenCallbacks,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            ProfileTopBar(onBackClick = callbacks.onBackClick)
        },
        snackbarHost = {
            MessageSnackbar(
                hostState = snackBarHostState,
                messageState = MessageSnackbarState(
                    successMessage = uiState.successMessage,
                    errorMessage = uiState.errorMessage,
                    onSuccessMessageShown = callbacks.onSuccessMessageShown,
                    onErrorMessageShown = callbacks.onErrorMessageShown
                )
            )
        }
    ) { paddingValues ->
        ProfileBody(
            paddingValues = paddingValues,
            isLoading = uiState.isLoadingProfile,
            isDarkMode = isDarkMode,
            onManageProfileClick = callbacks.onManageProfileClick,
//            onManageHobbiesClick = callbacks.onManageHobbiesClick,
            onDeleteAccountClick = callbacks.onDeleteAccountClick,
            onDarkModeToggle = callbacks.onDarkModeToggle
        )
    }

    if (dialogState.showDeleteDialog) {
        DeleteAccountDialog(
            onDismiss = callbacks.onDeleteDialogDismiss,
            onConfirm = callbacks.onDeleteDialogConfirm
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
                text = stringResource(R.string.profile),
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
    isLoading: Boolean,
    isDarkMode: Boolean,
    onManageProfileClick: () -> Unit,
//    onManageHobbiesClick: () -> Unit,
    onDeleteAccountClick: () -> Unit,
    onDarkModeToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
    ) {
        when {
            isLoading -> {
                LoadingIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }

            else -> {
                ProfileMenuItems(
                    isDarkMode = isDarkMode,
                    onManageProfileClick = onManageProfileClick,
//                    onManageHobbiesClick = onManageHobbiesClick,
                    onDeleteAccountClick = onDeleteAccountClick,
                    onDarkModeToggle = onDarkModeToggle
                )
            }
        }
    }
}

@Composable
private fun ProfileMenuItems(
    isDarkMode: Boolean,
    onManageProfileClick: () -> Unit,
//    onManageHobbiesClick: () -> Unit,
    onDeleteAccountClick: () -> Unit,
    onDarkModeToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(spacing.large)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        ProfileSection(
            onManageProfileClick = onManageProfileClick,
//            onManageHobbiesClick = onManageHobbiesClick
        )

        SettingsSection(
            isDarkMode = isDarkMode,
            onDarkModeToggle = onDarkModeToggle
        )

        AccountSection(
            onDeleteAccountClick = onDeleteAccountClick
        )
    }
}

@Composable
private fun ProfileSection(
    onManageProfileClick: () -> Unit,
//    onManageHobbiesClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(LocalSpacing.current.medium)
    ) {
        ManageProfileButton(onClick = onManageProfileClick)
//        ManageHobbiesButton(onClick = onManageHobbiesClick)
    }
}

@Composable
private fun SettingsSection(
    isDarkMode: Boolean,
    onDarkModeToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        Text(
            text = "Appearance",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Dark Mode",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )

            Switch(
                checked = isDarkMode,
                onCheckedChange = { onDarkModeToggle() }
            )
        }
    }
}

@Composable
private fun AccountSection(
    onDeleteAccountClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(LocalSpacing.current.medium)
    ) {
        DeleteAccountButton(onClick = onDeleteAccountClick)
    }
}

@Composable
private fun ManageProfileButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.manage_profile),
        iconRes = R.drawable.ic_manage_profile,
        onClick = onClick,
    )
}

@Composable
private fun ManageHobbiesButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.manage_hobbies),
        iconRes = R.drawable.ic_heart_smile,
        onClick = onClick,
    )
}

@Composable
private fun DeleteAccountButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.delete_account),
        iconRes = R.drawable.ic_delete_forever,
        onClick = onClick,
    )
}

@Composable
private fun DeleteAccountDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier
) {
    AlertDialog(
        modifier = modifier,
        onDismissRequest = onDismiss,
        title = {
            DeleteDialogTitle()
        },
        text = {
            DeleteDialogText()
        },
        confirmButton = {
            DeleteDialogConfirmButton(onClick = onConfirm)
        },
        dismissButton = {
            DeleteDialogDismissButton(onClick = onDismiss)
        }
    )
}

@Composable
private fun DeleteDialogTitle(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.delete_account),
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = modifier
    )
}

@Composable
private fun DeleteDialogText(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.delete_account_confirmation),
        modifier = modifier
    )
}

@Composable
private fun DeleteDialogConfirmButton(
    onClick: () -> Unit,
) {
    Button(
        fullWidth = false,
        onClick = onClick,
    ) {
        Text(stringResource(R.string.confirm))
    }
}

@Composable
private fun DeleteDialogDismissButton(
    onClick: () -> Unit,
) {
    Button(
        fullWidth = false,
        type = "secondary",
        onClick = onClick,
    ) {
        Text(stringResource(R.string.cancel))
    }
}

@Composable
private fun LoadingIndicator(
    modifier: Modifier = Modifier
) {
    CircularProgressIndicator(modifier = modifier)
}
