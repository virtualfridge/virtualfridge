package com.cpen321.usermanagement.ui.screens

import Icon
import androidx.compose.foundation.BorderStroke
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
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.FridgeViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainUiState
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    mainViewModel: MainViewModel,
    fridgeViewModel: FridgeViewModel,
    onProfileClick: () -> Unit,
    onRecipeClick: () -> Unit,
    onTestBarcodeClick: () -> Unit,
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
        mainUiState = mainUiState,
        fridgeUiState = fridgeUiState,
        snackBarHostState = snackBarHostState,
        onProfileClick = onProfileClick,
        showScanner = showScanner,
        onScanRequested = { showScanner = true },
        onBarcodeDetected = { barcode ->
            showScanner = false
            mainViewModel.handleScannedBarcode(barcode)
        },
        onScannerClose = { showScanner = false },
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
        onTestBarcodeClick = onTestBarcodeClick,
        onRecipeButtonClick = {
            if (fridgeUiState.selectedItems.isNotEmpty()) {
                showRecipeSheet = true
            }
        },
        onNotificationClick = {
            mainViewModel.sendTestNotification()
        }
    )

    // Recipe Options Bottom Sheet
    if (showRecipeSheet) {
        RecipeOptionsBottomSheet(
            sheetState = sheetState,
            onDismiss = {
                showRecipeSheet = false
                fridgeViewModel.hideRecipeOptions()
            },
            onMealDBRecipe = {
                showRecipeSheet = false
                fridgeViewModel.hideRecipeOptions()
                // Get selected items and convert to ingredient names
                val selectedItems = fridgeViewModel.getSelectedItemsData()
                val ingredientNames = selectedItems.mapNotNull { fridgeItem ->
                    fridgeItem.foodType.name?.lowercase()?.replace(" ", "_")
                }
                // Show results sheet immediately (will show loading state)
                showRecipeResults = true
                // Trigger MealDB recipe generation directly
                mainViewModel.fetchRecipes(ingredientNames)
                // Clear selection after generating
                fridgeViewModel.clearSelection()
            },
            onAIRecipe = {
                showRecipeSheet = false
                fridgeViewModel.hideRecipeOptions()
                // Get selected items and convert to ingredient names
                val selectedItems = fridgeViewModel.getSelectedItemsData()
                val ingredientNames = selectedItems.mapNotNull { fridgeItem ->
                    fridgeItem.foodType.name?.lowercase()?.replace(" ", "_")
                }
                // Show results sheet immediately (will show loading state)
                showRecipeResults = true
                // Trigger AI recipe generation directly
                mainViewModel.generateAiRecipe(ingredientNames)
                // Clear selection after generating
                fridgeViewModel.clearSelection()
            }
        )
    }

    // Recipe Results Bottom Sheet
    if (showRecipeResults) {
        RecipeResultsBottomSheet(
            sheetState = resultsSheetState,
            mainUiState = mainUiState,
            onDismiss = {
                showRecipeResults = false
                // Clear recipe data when dismissed
                mainViewModel.clearRecipeError()
                mainViewModel.clearAiError()
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainContent(
    mainUiState: MainUiState,
    fridgeUiState: com.cpen321.usermanagement.ui.viewmodels.FridgeUiState,
    snackBarHostState: SnackbarHostState,
    onProfileClick: () -> Unit,
    showScanner: Boolean,
    onScanRequested: () -> Unit,
    onBarcodeDetected: (String) -> Unit,
    onScannerClose: () -> Unit,
    onSuccessMessageShown: () -> Unit,
    onErrorMessageShown: () -> Unit,
    onItemSelected: (String) -> Unit,
    onItemPercentChanged: (String, Int) -> Unit,
    onItemRemove: (String) -> Unit,
    onTestBarcodeClick: () -> Unit,
    onRecipeButtonClick: () -> Unit,
    onNotificationClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        topBar = { MainTopBar(onProfileClick = onProfileClick) },
        snackbarHost = {
            MainSnackbarHost(
                hostState = snackBarHostState,
                successMessage = mainUiState.successMessage ?: fridgeUiState.successMessage,
                errorMessage = mainUiState.scanError ?: fridgeUiState.errorMessage,
                onSuccessMessageShown = onSuccessMessageShown,
                onErrorMessageShown = onErrorMessageShown
            )
        },
        bottomBar = {
            MainBottomBar(
                hasSelectedItems = fridgeUiState.selectedItems.isNotEmpty(),
                onScanClick = onScanRequested,
                onTestBarcodeClick = onTestBarcodeClick,
                onRecipeClick = onRecipeButtonClick,
                onNotificationClick = onNotificationClick
            )
        }
    ) { paddingValues ->
        FridgeListBody(
            paddingValues = paddingValues,
            showScanner = showScanner,
            onBarcodeDetected = onBarcodeDetected,
            onScannerClose = onScannerClose,
            fridgeUiState = fridgeUiState,
            onItemSelected = onItemSelected,
            onItemPercentChanged = onItemPercentChanged,
            onItemRemove = onItemRemove
        )
    }
}

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
    onBarcodeDetected: (String) -> Unit,
    onScannerClose: () -> Unit,
    fridgeUiState: com.cpen321.usermanagement.ui.viewmodels.FridgeUiState,
    onItemSelected: (String) -> Unit,
    onItemPercentChanged: (String, Int) -> Unit,
    onItemRemove: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
    ) {
        if (showScanner) {
            ScannerScreen(
                onBarcodeDetected = onBarcodeDetected,
                onClose = onScannerClose,
                onVisionItemAdded = { _ ->
                    // Refresh fridge contents after a successful Vision add
                    fridgeViewModel.loadFridgeItems()
                }
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
                    FridgeItemsList(
                        items = fridgeUiState.fridgeItems,
                        selectedItems = fridgeUiState.selectedItems,
                        isUpdating = fridgeUiState.isUpdating,
                        onItemSelected = onItemSelected,
                        onItemPercentChanged = onItemPercentChanged,
                        onItemRemove = onItemRemove
                    )
                }
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
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = spacing.large),
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

@Composable
private fun MainBottomBar(
    hasSelectedItems: Boolean,
    onScanClick: () -> Unit,
    onTestBarcodeClick: () -> Unit,
    onRecipeClick: () -> Unit,
    onNotificationClick: () -> Unit,
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

            // Test Barcode Button
            OutlinedButton(
                onClick = onTestBarcodeClick,
                modifier = Modifier.weight(1f)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "🧪",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "Test",
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

            Spacer(modifier = Modifier.width(8.dp))

            // Notification Test Button
            OutlinedButton(
                onClick = onNotificationClick,
                modifier = Modifier.weight(1f)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "🔔",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "Notify",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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
            if (!mainUiState.isFetchingRecipes && !mainUiState.isGeneratingAiRecipe &&
                mainUiState.recipeSummaries.isEmpty() && mainUiState.aiRecipe == null &&
                mainUiState.recipeError == null && mainUiState.aiError == null) {
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

            if (mainUiState.recipeSummaries.isNotEmpty()) {
                Text(
                    text = "🍳 Recipes from MealDB",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )

                if (mainUiState.recipeIngredients.isNotEmpty()) {
                    Text(
                        text = "Ingredients: ${mainUiState.recipeIngredients.joinToString(", ")}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                mainUiState.recipeSummaries.forEach { meal ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = meal.strMeal,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "Meal ID: ${meal.idMeal}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                            )

                            meal.strMealThumb?.takeIf { it.isNotBlank() }?.let { url ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Image: $url",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                }
            }

            // AI Recipe Results
            mainUiState.aiRecipe?.let { aiRecipeText ->
                Text(
                    text = "✨ AI Chef Recipe",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )

                if (mainUiState.aiIngredients.isNotEmpty()) {
                    Text(
                        text = "Ingredients: ${mainUiState.aiIngredients.joinToString(", ")}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                mainUiState.aiModel?.let { model ->
                    Text(
                        text = "Generated by: $model",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Text(
                        text = aiRecipeText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
