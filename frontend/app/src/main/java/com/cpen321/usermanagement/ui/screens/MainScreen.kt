package com.cpen321.usermanagement.ui.screens

import Icon
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.FridgeItem
import com.cpen321.usermanagement.ui.components.FridgeItemCard
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.components.RecipeCard
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.FridgeUiState
import com.cpen321.usermanagement.ui.viewmodels.FridgeViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainUiState
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel
import com.cpen321.usermanagement.ui.viewmodels.SortOption

@OptIn(ExperimentalMaterial3Api::class)
/*
 * Rationale for suppression:
 * - This composable wires UI state to multiple UI regions (content, sheets).
 * - The length comes from Compose DSL and event wiring, not complex logic.
 * - Extracting every block would add indirection and reduce cohesion/readability.
 * - Keeping it inline preserves a clear, single place to understand screen behavior.
 */
@Suppress("LongMethod", "ComplexMethod")
@Composable
fun MainScreen(
    mainViewModel: MainViewModel,
    fridgeViewModel: FridgeViewModel,
    onProfileClick: () -> Unit,
    onRecipeClick: () -> Unit,
    onBarcodeResultClick: () -> Unit,
    onFridgeClick: () -> Unit
) {
    val mainUiState by mainViewModel.uiState.collectAsState()
    val fridgeUiState by fridgeViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }
    var showScanner by remember { mutableStateOf(false) }
    var showRecipeSheet by remember { mutableStateOf(false) }
    var showRecipeResults by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()
    val resultsSheetState = rememberModalBottomSheetState()

    // Navigate to barcode result screen when a barcode is successfully scanned
    LaunchedEffect(mainUiState.barcodeResult) {
        if (mainUiState.barcodeResult != null) {
            // Refresh fridge items to show the newly added item
            fridgeViewModel.loadFridgeItems()
            onBarcodeResultClick()
        }
    }

    // Show recipe options sheet when requested
    LaunchedEffect(fridgeUiState.showRecipeOptions) {
        if (fridgeUiState.showRecipeOptions) {
            showRecipeSheet = true
        }
    }

    MainContent(
        state = MainContentState(
            mainUiState = mainUiState,
            fridgeUiState = fridgeUiState,
            snackBarHostState = snackBarHostState,
            showScanner = showScanner,
        ),
        actions = MainContentActions(
            onProfileClick = onProfileClick,
            onScanRequested = { showScanner = true },
            onBarcodeDetected = { barcode ->
                showScanner = false
                mainViewModel.handleScannedBarcode(barcode)
            },
            onScannerClose = {
                showScanner = false
                // Reload the fridge items from the backend so we can see the changes
                fridgeViewModel.loadFridgeItems()
            },
            onSuccessMessageShown = {
                mainViewModel.clearSuccessMessage()
                fridgeViewModel.clearSuccessMessage()
            },
            onErrorMessageShown = {
                mainViewModel.clearScanError()
                fridgeViewModel.clearError()
            },
            onItemSelected = fridgeViewModel::toggleItemSelection,
            onItemPercentChanged = fridgeViewModel::updateFoodItemPercent,
            onItemRemove = fridgeViewModel::removeFoodItem,
            onSortOptionChanged = fridgeViewModel::setSortOption,
            onRecipeButtonClick = {
                if (fridgeUiState.selectedItems.isNotEmpty()) {
                    showRecipeSheet = true
                }
            }
        )
    )

    MainRecipeSheets(
        state = RecipeSheetsState(
            showRecipeSheet = showRecipeSheet,
            sheetState = sheetState,
            showRecipeResults = showRecipeResults,
            resultsSheetState = resultsSheetState,
            mainUiState = mainUiState,
        ),
        actions = RecipeSheetsActions(
            onOptionsDismiss = {
                showRecipeSheet = false
                fridgeViewModel.hideRecipeOptions()
            },
            onMealDBRecipe = {
                showRecipeSheet = false
                fridgeViewModel.hideRecipeOptions()
                val selectedItems = fridgeViewModel.getSelectedItemsData()
                val ingredientNames = selectedItems.mapNotNull { fridgeItem ->
                    fridgeItem.foodType.name?.lowercase()?.replace(" ", "_")
                }
                showRecipeResults = true
                mainViewModel.fetchRecipes(ingredientNames)
                fridgeViewModel.clearSelection()
            },
            onAIRecipe = {
                showRecipeSheet = false
                fridgeViewModel.hideRecipeOptions()
                val selectedItems = fridgeViewModel.getSelectedItemsData()
                val ingredientNames = selectedItems.mapNotNull { fridgeItem ->
                    fridgeItem.foodType.name?.lowercase()?.replace(" ", "_")
                }
                showRecipeResults = true
                mainViewModel.generateAiRecipe(ingredientNames)
                fridgeViewModel.clearSelection()
            },
            onResultsDismiss = {
                showRecipeResults = false
                mainViewModel.clearRecipeError()
                mainViewModel.clearAiError()
            }
        )
    )
}

@ExperimentalMaterial3Api
@Composable
private fun MainRecipeSheets(
    state: RecipeSheetsState,
    actions: RecipeSheetsActions,
) {
    // Recipe Options Bottom Sheet
    if (state.showRecipeSheet) {
        RecipeOptionsBottomSheet(
            sheetState = state.sheetState,
            onDismiss = actions.onOptionsDismiss,
            onMealDBRecipe = actions.onMealDBRecipe,
            onAIRecipe = actions.onAIRecipe
        )
    }

    // Recipe Results Bottom Sheet
    if (state.showRecipeResults) {
        RecipeResultsBottomSheet(
            sheetState = state.resultsSheetState,
            mainUiState = state.mainUiState,
            onDismiss = actions.onResultsDismiss
        )
    }
}

private data class RecipeSheetsState @OptIn(ExperimentalMaterial3Api::class) constructor(
    val showRecipeSheet: Boolean,
    val sheetState: SheetState,
    val showRecipeResults: Boolean,
    val resultsSheetState: SheetState,
    val mainUiState: MainUiState,
)

private data class RecipeSheetsActions(
    val onOptionsDismiss: () -> Unit,
    val onMealDBRecipe: () -> Unit,
    val onAIRecipe: () -> Unit,
    val onResultsDismiss: () -> Unit,
)

@Composable
private fun SortOptionsRow(
    sortOption: com.cpen321.usermanagement.ui.viewmodels.SortOption,
    onSortOptionChanged: (com.cpen321.usermanagement.ui.viewmodels.SortOption) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    var showSortMenu by remember { mutableStateOf(false) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = spacing.medium),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Sort by:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )

        Box {
            Button(onClick = { showSortMenu = !showSortMenu }) {
                Text(
                    text = when (sortOption) {
                        SortOption.EXPIRATION_DATE -> "Expiration Date"
                        SortOption.ADDED_DATE -> "Added Date"
                        SortOption.NUTRITIONAL_VALUE -> "Nutritional Value"
                        SortOption.NAME -> "Name"
                    }
                )
            }

            DropdownMenu(
                expanded = showSortMenu,
                onDismissRequest = { showSortMenu = false }
            ) {
                SortOption.entries.forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = when (option) {
                                    SortOption.EXPIRATION_DATE -> "Expiration Date"
                                    SortOption.ADDED_DATE -> "Added Date"
                                    SortOption.NUTRITIONAL_VALUE -> "Nutritional Value"
                                    SortOption.NAME -> "Name"
                                }
                            )
                        },
                        onClick = {
                            onSortOptionChanged(option)
                            showSortMenu = false
                        }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainContent(
    state: MainContentState,
    actions: MainContentActions,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        topBar = { MainTopBar(onProfileClick = actions.onProfileClick) },
        snackbarHost = {
            MainSnackbarHost(
                hostState = state.snackBarHostState,
                successMessage = state.mainUiState.successMessage
                    ?: state.fridgeUiState.successMessage,
                errorMessage = state.mainUiState.scanError ?: state.fridgeUiState.errorMessage,
                onSuccessMessageShown = actions.onSuccessMessageShown,
                onErrorMessageShown = actions.onErrorMessageShown
            )
        },
        bottomBar = {
            MainBottomBar(
                hasSelectedItems = state.fridgeUiState.selectedItems.isNotEmpty(),
                onScanClick = actions.onScanRequested,
                onRecipeClick = actions.onRecipeButtonClick
            )
        }
    ) { paddingValues ->
        FridgeListBody(
            paddingValues = paddingValues,
            showScanner = state.showScanner,
            fridgeUiState = state.fridgeUiState,
            actions = FridgeListActions(
                onBarcodeDetected = actions.onBarcodeDetected,
                onScannerClose = actions.onScannerClose,
                onItemSelected = actions.onItemSelected,
                onItemPercentChanged = actions.onItemPercentChanged,
                onItemRemove = actions.onItemRemove,
                onSortOptionChanged = actions.onSortOptionChanged,
            )
        )
    }
}

private data class MainContentState(
    val mainUiState: MainUiState,
    val fridgeUiState: FridgeUiState,
    val snackBarHostState: SnackbarHostState,
    val showScanner: Boolean,
)

private data class MainContentActions(
    val onProfileClick: () -> Unit,
    val onScanRequested: () -> Unit,
    val onBarcodeDetected: (String) -> Unit,
    val onScannerClose: () -> Unit,
    val onSuccessMessageShown: () -> Unit,
    val onErrorMessageShown: () -> Unit,
    val onItemSelected: (String) -> Unit,
    val onItemPercentChanged: (String, Int) -> Unit,
    val onItemRemove: (String) -> Unit,
    val onSortOptionChanged: (com.cpen321.usermanagement.ui.viewmodels.SortOption) -> Unit,
    val onRecipeButtonClick: () -> Unit
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainTopBar(
    onProfileClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = { AppTitle() },
        actions = { ProfileActionButton(onClick = onProfileClick) },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
private fun AppTitle(modifier: Modifier = Modifier) {
    Text(
        text = stringResource(R.string.app_name),
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.Medium,
        modifier = modifier
    )
}

@Composable
private fun ProfileActionButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    val spacing = LocalSpacing.current

    IconButton(
        onClick = onClick,
        modifier = modifier.size(spacing.extraLarge2)
    ) { ProfileIcon() }
}

@Composable
private fun ProfileIcon() {
    Icon(
        name = R.drawable.ic_account_circle
    )
}

@Composable
private fun MainSnackbarHost(
    hostState: SnackbarHostState,
    successMessage: String?,
    errorMessage: String?,
    onSuccessMessageShown: () -> Unit,
    onErrorMessageShown: () -> Unit,
    modifier: Modifier = Modifier
) {
    MessageSnackbar(
        hostState = hostState,
        messageState = MessageSnackbarState(
            successMessage = successMessage,
            errorMessage = errorMessage,
            onSuccessMessageShown = onSuccessMessageShown,
            onErrorMessageShown = onErrorMessageShown
        ),
        modifier = modifier
    )
}

@Composable
private fun FridgeListBody(
    paddingValues: PaddingValues,
    showScanner: Boolean,
    fridgeUiState: FridgeUiState,
    actions: FridgeListActions,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
    ) {
        if (showScanner) {
            ScannerScreen(
                onBarcodeDetected = actions.onBarcodeDetected,
                onClose = actions.onScannerClose
            )
        } else {
            when {
                fridgeUiState.isLoading -> {
                    LoadingContent()
                }

                fridgeUiState.fridgeItems.isEmpty() -> {
                    EmptyFridgeContent()
                }

                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = spacing.large)
                    ) {
                        SortOptionsRow(
                            sortOption = fridgeUiState.sortOption,
                            onSortOptionChanged = actions.onSortOptionChanged,
                        )

                        // Fridge items list
                        FridgeItemsList(
                            items = fridgeUiState.fridgeItems,
                            selectedItems = fridgeUiState.selectedItems,
                            isUpdating = fridgeUiState.isUpdating,
                            onItemSelected = actions.onItemSelected,
                            onItemPercentChanged = actions.onItemPercentChanged,
                            onItemRemove = actions.onItemRemove
                        )
                    }
                }
            }
        }
    }
}

private data class FridgeListActions(
    val onBarcodeDetected: (String) -> Unit,
    val onScannerClose: () -> Unit,
    val onItemSelected: (String) -> Unit,
    val onItemPercentChanged: (String, Int) -> Unit,
    val onItemRemove: (String) -> Unit,
    val onSortOptionChanged: (SortOption) -> Unit,
)

@Composable
private fun LoadingContent(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "🧊",
            fontSize = 64.sp
        )
        Spacer(modifier = Modifier.height(24.dp))
        CircularProgressIndicator(
            color = MaterialTheme.colorScheme.primary,
            strokeWidth = 4.dp
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Opening your fridge...",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Loading fresh items",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
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
        // Multiple food emojis for empty state
        Text(
            text = "🥗 🍎 🥛",
            style = MaterialTheme.typography.displayLarge,
            fontSize = 64.sp
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Your Virtual Fridge",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "is waiting to be filled!",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Tap the 📷 Scan button below to start adding delicious items to your fridge",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 32.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "or use 🧪 Test to try it out!",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
            modifier = Modifier.padding(horizontal = 32.dp)
        )
    }
}

@Composable
private fun FridgeItemsList(
    items: List<FridgeItem>,
    selectedItems: Set<String>,
    isUpdating: Boolean,
    onItemSelected: (String) -> Unit,
    onItemPercentChanged: (String, Int) -> Unit,
    onItemRemove: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(spacing.medium),
        contentPadding = PaddingValues(vertical = spacing.medium)
    ) {
        items(items, key = { it.foodItem._id }) { item ->
            SelectableFridgeItemCard(
                fridgeItem = item,
                isSelected = selectedItems.contains(item.foodItem._id),
                isUpdating = isUpdating,
                onSelected = { onItemSelected(item.foodItem._id) },
                onPercentChanged = { newPercent ->
                    onItemPercentChanged(item.foodItem._id, newPercent)
                },
                onRemove = { onItemRemove(item.foodItem._id) }
            )
        }
    }
}

@Composable
private fun SelectableFridgeItemCard(
    fridgeItem: FridgeItem,
    isSelected: Boolean,
    isUpdating: Boolean,
    onSelected: () -> Unit,
    onPercentChanged: (Int) -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = if (isSelected) {
        MaterialTheme.colorScheme.primary
    } else {
        Color.Transparent
    }

    val borderWidth = if (isSelected) 3.dp else 0.dp

    Box(
        modifier = modifier
            .fillMaxWidth()
            .border(borderWidth, borderColor, MaterialTheme.shapes.medium)
            .clickable { onSelected() }
    ) {
        FridgeItemCard(
            fridgeItem = fridgeItem,
            isUpdating = isUpdating,
            onPercentChanged = onPercentChanged,
            onRemove = onRemove
        )
    }
}

/*
 * Rationale for suppression:
 * - This composable renders a simple bottom action bar with four buttons.
 * - The apparent length/complexity comes from verbose Compose DSL (markup-like UI code),
 *   not from branching logic or algorithmic complexity.
 * - Extracting each button into separate composables adds indirection and scatters tightly
 *   related styling/enablement logic, making the code harder to scan as a cohesive unit.
 * - Keeping it inline preserves readability and keeps all UI decisions in one place.
 */
@Suppress("LongMethod", "ComplexMethod")
@Composable
private fun MainBottomBar(
    hasSelectedItems: Boolean,
    onScanClick: () -> Unit,
    onRecipeClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    BottomAppBar(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.surfaceVariant,
        contentColor = MaterialTheme.colorScheme.onSurfaceVariant
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Scan Barcode Button
            Button(
                onClick = onScanClick,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "📷",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "Scan",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Recipe Button (enabled only when items are selected)
            Button(
                onClick = onRecipeClick,
                modifier = Modifier.weight(1f),
                enabled = hasSelectedItems,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary,
                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                )
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "🍳",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = if (!hasSelectedItems) Modifier.alpha(0.4f) else Modifier
                    )
                    Text(
                        text = "Recipe",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
/*
 * Rationale for suppression:
 * - This bottom sheet presents two option cards and a header.
 * - Its length comes from Compose UI markup and strings, not complex logic.
 * - Splitting each visual block would add indirection and hurt cohesion of this small sheet.
 * - Keeping it inline keeps the flow easy to scan and maintain.
 */
@Suppress("LongMethod", "ComplexMethod")
@Composable
private fun RecipeOptionsBottomSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onMealDBRecipe: () -> Unit,
    onAIRecipe: () -> Unit,
    modifier: Modifier = Modifier
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "👨‍🍳",
                    fontSize = 48.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Choose Your Recipe Style",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Let's cook something delicious!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // MealDB API Option
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onMealDBRecipe() },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "🍳",
                            fontSize = 32.sp
                        )
                    }
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "Recipe Database",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Discover proven recipes from MealDB",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            // Gemini AI Option
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onAIRecipe() },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✨",
                            fontSize = 32.sp
                        )
                    }
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "AI Chef",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Custom recipes powered by Gemini AI",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
/*
 * Rationale for suppression:
 * - This bottom sheet composes several loading, error, and results sections.
 * - The function reads long due to declarative UI markup (Compose) and string literals,
 *   not complex control flow or algorithmic logic.
 * - Extracting each visual block into separate composables would add indirection and
 *   split tightly related UI context, reducing readability in practice.
 * - Keeping it inline makes it easier to scan and maintain the cohesive UI state mapping.
 */
@Suppress("LongMethod", "ComplexMethod")
@Composable
private fun RecipeResultsBottomSheet(
    sheetState: SheetState,
    mainUiState: MainUiState,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Loading states
            if (mainUiState.isFetchingRecipes) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    Text(
                        text = "Fetching recipes from MealDB...",
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            if (mainUiState.isGeneratingAiRecipe) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    Text(
                        text = "Generating AI recipe with Gemini...",
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            // Error states
            mainUiState.recipeError?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            mainUiState.aiError?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            // MealDB Results
            val isIdle = !mainUiState.isFetchingRecipes && !mainUiState.isGeneratingAiRecipe
            val hasNoResults = mainUiState.recipe == null && mainUiState.aiRecipe == null
            val hasNoErrors = mainUiState.recipeError == null && mainUiState.aiError == null
            if (isIdle && hasNoResults && hasNoErrors) {
                // Show "No Recipes Found" when done loading but no results
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "🔍",
                            fontSize = 48.sp
                        )
                        Text(
                            text = "No Recipes Found",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "Try selecting different ingredients or check back later",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            if (mainUiState.recipe != null) {
                RecipeCard(
                    title = "🍳 Recipe from MealDB",
                    recipe = mainUiState.recipe,
                    cardColor = MaterialTheme.colorScheme.primaryContainer,
                    textColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }

            // AI Recipe Results
            mainUiState.aiRecipe?.let { aiRecipe ->
                RecipeCard(
                    title = "✨ AI Chef Recipe",
                    recipe = aiRecipe,
                    cardColor = MaterialTheme.colorScheme.secondaryContainer,
                    textColor = MaterialTheme.colorScheme.onSecondaryContainer
                )
            }
        }
    }
}
