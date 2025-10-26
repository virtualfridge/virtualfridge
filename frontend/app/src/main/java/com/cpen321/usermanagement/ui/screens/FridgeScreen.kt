package com.cpen321.usermanagement.ui.screens

import Icon
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.ui.components.FridgeItemCard
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.FridgeViewModel
import com.cpen321.usermanagement.ui.viewmodels.SortOption

@Composable
fun FridgeScreen(
    fridgeViewModel: FridgeViewModel, onBackClick: () -> Unit
) {
    val uiState by fridgeViewModel.uiState.collectAsState()
    val snackBarHostState = remember { androidx.compose.material3.SnackbarHostState() }

    Scaffold(topBar = {
        FridgeTopBar(
            onBackClick = onBackClick, onRefreshClick = { fridgeViewModel.loadFridgeItems() })
    }, snackbarHost = {
        MessageSnackbar(
            hostState = snackBarHostState, messageState = MessageSnackbarState(
                successMessage = uiState.successMessage,
                errorMessage = uiState.error,
                onSuccessMessageShown = fridgeViewModel::clearSuccessMessage,
                onErrorMessageShown = fridgeViewModel::clearError
            )
        )
    }) { paddingValues ->
        FridgeContent(
            paddingValues = paddingValues,
            uiState = uiState,
            onItemPercentChanged = fridgeViewModel::updateFoodItemPercent,
            onRefreshClick = fridgeViewModel::loadFridgeItems,
            onSortOptionChanged = fridgeViewModel::setSortOption,
            onRemove = fridgeViewModel::removeFoodItem,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FridgeTopBar(
    onBackClick: () -> Unit, onRefreshClick: () -> Unit, modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier, title = {
        Text(
            text = "My Fridge",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Medium
        )
    }, navigationIcon = {
        IconButton(onClick = onBackClick) {
            Icon(name = R.drawable.ic_arrow_back)
        }
    }, actions = {
        IconButton(onClick = onRefreshClick) {
            Text("↻")
        }
    }, colors = TopAppBarDefaults.topAppBarColors(
        containerColor = MaterialTheme.colorScheme.surface,
        titleContentColor = MaterialTheme.colorScheme.onSurface
    )
    )
}

@Composable
private fun FridgeContent(
    paddingValues: PaddingValues,
    uiState: com.cpen321.usermanagement.ui.viewmodels.FridgeUiState,
    onItemPercentChanged: (String, Int) -> Unit,
    onRefreshClick: () -> Unit,
    onSortOptionChanged: (SortOption) -> Unit,
    onRemove: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    var showSortMenu by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = spacing.large, vertical = spacing.medium),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        // Sort options
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Sort by:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Button(
                onClick = { showSortMenu = !showSortMenu }) {
                Text(
                    text = when (uiState.sortOption) {
                        SortOption.EXPIRATION_DATE -> "Expiration Date"
                        SortOption.ADDED_DATE -> "Added Date"
                        SortOption.NUTRITIONAL_VALUE -> "Nutritional Value"
                        SortOption.NAME -> "Name"
                    }
                )
            }
        }

        DropdownMenu(
            expanded = showSortMenu, onDismissRequest = { showSortMenu = false }) {
            SortOption.entries.forEach { option ->
                DropdownMenuItem(text = {
                    Text(
                        text = when (option) {
                            SortOption.EXPIRATION_DATE -> "Expiration Date"
                            SortOption.ADDED_DATE -> "Added Date"
                            SortOption.NUTRITIONAL_VALUE -> "Nutritional Value"
                            SortOption.NAME -> "Name"
                        }
                    )
                }, onClick = {
                    onSortOptionChanged(option)
                    showSortMenu = false
                })
            }
        }

        // Content
        when {
            uiState.isLoading -> {
                LoadingContent()
            }

            uiState.fridgeItems.isEmpty() -> {
                EmptyFridgeContent()
            }

            else -> {
                FridgeItemsList(
                    items = uiState.fridgeItems,
                    isUpdating = uiState.isUpdating,
                    onItemPercentChanged = onItemPercentChanged,
                    onRemove = onRemove
                )
            }
        }
    }
}

@Composable
private fun LoadingContent(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Loading your fridge...", style = MaterialTheme.typography.bodyLarge
        )
    }
}

@Composable
private fun EmptyFridgeContent(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "🍽️", style = MaterialTheme.typography.displayLarge
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Your fridge is empty",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Start by scanning some barcodes to add items to your fridge",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun FridgeItemsList(
    items: List<FridgeItem>,
    isUpdating: Boolean,
    onItemPercentChanged: (String, Int) -> Unit,
    onRemove: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(items) { item ->
            FridgeItemCard(
                fridgeItem = item,
                isUpdating = isUpdating,
                onPercentChanged = { newPercent ->
                    onItemPercentChanged(item.foodItem._id, newPercent)
                },
                onRemove = { onRemove(item.foodItem._id) })
        }
    }
}
