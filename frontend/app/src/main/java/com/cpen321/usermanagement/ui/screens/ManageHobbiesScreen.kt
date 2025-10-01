package com.cpen321.usermanagement.ui.screens

import Button
import Icon
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.viewmodels.ProfileUiState
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel
import com.cpen321.usermanagement.ui.theme.LocalSpacing

private data class HobbiesFormData(
    val allHobbies: List<String>,
    val selectedHobbies: Set<String>,
    val onHobbyToggle: (String) -> Unit,
    val onSaveClick: () -> Unit
)

private data class ManageHobbiesScreenData(
    val uiState: ProfileUiState,
    val snackBarHostState: SnackbarHostState,
    val onSuccessMessageShown: () -> Unit,
    val onErrorMessageShown: () -> Unit
)

private data class ManageHobbiesScreenActions(
    val onBackClick: () -> Unit,
    val onHobbyToggle: (String) -> Unit,
    val onSaveClick: () -> Unit
)

@Composable
fun ManageHobbiesScreen(
    profileViewModel: ProfileViewModel,
    onBackClick: () -> Unit,
) {
    val uiState by profileViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }

    // Side effects
    LaunchedEffect(Unit) {
        profileViewModel.clearSuccessMessage()
        profileViewModel.clearError()
        if (uiState.user == null) {
            profileViewModel.loadProfile()
        }
    }

    ManageHobbiesContent(
        data = ManageHobbiesScreenData(
            uiState = uiState,
            snackBarHostState = snackBarHostState,
            onSuccessMessageShown = profileViewModel::clearSuccessMessage,
            onErrorMessageShown = profileViewModel::clearError
        ),
        actions = ManageHobbiesScreenActions(
            onBackClick = onBackClick,
            onHobbyToggle = profileViewModel::toggleHobby,
            onSaveClick = profileViewModel::saveHobbies
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ManageHobbiesContent(
    data: ManageHobbiesScreenData,
    actions: ManageHobbiesScreenActions,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            ManageHobbiesTopBar(onBackClick = actions.onBackClick)
        },
        snackbarHost = {
            MessageSnackbar(
                hostState = data.snackBarHostState,
                messageState = MessageSnackbarState(
                    successMessage = data.uiState.successMessage,
                    errorMessage = data.uiState.errorMessage,
                    onSuccessMessageShown = data.onSuccessMessageShown,
                    onErrorMessageShown = data.onErrorMessageShown
                )
            )
        }
    ) { paddingValues ->
        ManageHobbiesBody(
            paddingValues = paddingValues,
            uiState = data.uiState,
            onHobbyToggle = actions.onHobbyToggle,
            onSaveClick = actions.onSaveClick
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ManageHobbiesTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = stringResource(R.string.manage_hobbies),
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
private fun ManageHobbiesBody(
    paddingValues: PaddingValues,
    uiState: ProfileUiState,
    onHobbyToggle: (String) -> Unit,
    onSaveClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
    ) {
        when {
            uiState.isLoadingProfile -> {
                LoadingIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }

            else -> {
                HobbiesForm(
                    formData = HobbiesFormData(
                        allHobbies = uiState.allHobbies,
                        selectedHobbies = uiState.selectedHobbies,
                        onHobbyToggle = onHobbyToggle,
                        onSaveClick = onSaveClick
                    ),
                    isSaving = uiState.isSavingProfile,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(spacing.large)
                )
            }
        }
    }
}

@Composable
private fun HobbiesForm(
    formData: HobbiesFormData,
    isSaving: Boolean,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(spacing.large)
    ) {
        HobbiesSelectionCard(
            allHobbies = formData.allHobbies,
            selectedHobbies = formData.selectedHobbies,
            onHobbyToggle = formData.onHobbyToggle
        )

        SaveButton(
            isSaving = isSaving,
            onClick = formData.onSaveClick
        )
    }
}

@Composable
private fun HobbiesSelectionCard(
    allHobbies: List<String>,
    selectedHobbies: Set<String>,
    onHobbyToggle: (String) -> Unit,
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
                .padding(spacing.medium)
        ) {
            Text(
                text = stringResource(R.string.select_hobbies),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(spacing.medium))

            HobbiesGrid(
                allHobbies = allHobbies,
                selectedHobbies = selectedHobbies,
                onHobbyToggle = onHobbyToggle
            )
        }
    }
}

@Composable
private fun HobbiesGrid(
    allHobbies: List<String>,
    selectedHobbies: Set<String>,
    onHobbyToggle: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    LazyVerticalGrid(
        modifier = modifier.fillMaxWidth(),
        columns = GridCells.Fixed(2),
        horizontalArrangement = Arrangement.spacedBy(spacing.small),
        verticalArrangement = Arrangement.spacedBy(spacing.small)
    ) {
        items(
            items = allHobbies,
            key = { hobby -> hobby }
        ) { hobby ->
            HobbyChip(
                hobby = hobby,
                isSelected = selectedHobbies.contains(hobby),
                onClick = { onHobbyToggle(hobby) }
            )
        }
    }
}

@Composable
private fun HobbyChip(
    hobby: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    FilterChip(
        modifier = modifier.fillMaxWidth(),
        selected = isSelected,
        onClick = onClick,
        label = {
            Text(
                text = hobby,
                maxLines = 1
            )
        },
        shape = CircleShape,
        leadingIcon = if (isSelected) {
            {
                Icon(
                    name = R.drawable.ic_check,
                )
            }
        } else null,
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
        )
    )
}

@Composable
private fun SaveButton(
    isSaving: Boolean,
    onClick: () -> Unit,
) {
    val spacing = LocalSpacing.current

    Button(
        onClick = onClick,
        enabled = !isSaving
    ) {
        if (isSaving) {
            CircularProgressIndicator(
                modifier = Modifier.size(spacing.medium),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(spacing.small))
        }
        Text(
            text = stringResource(
                if (isSaving) R.string.saving else R.string.save
            ),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun LoadingIndicator(
    modifier: Modifier = Modifier
) {
    CircularProgressIndicator(modifier = modifier)
}