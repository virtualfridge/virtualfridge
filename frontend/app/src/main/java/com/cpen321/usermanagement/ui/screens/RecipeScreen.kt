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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.IngredientOption
import com.cpen321.usermanagement.ui.viewmodels.MainUiState
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

@Composable
fun RecipeScreen(
    mainViewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val uiState by mainViewModel.uiState.collectAsState()
    var showRawJson by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.recipesJson) {
        showRawJson = false
    }

    Scaffold(
        topBar = {
            RecipeTopBar(
                onBackClick = onBackClick
            )
        }
    ) { paddingValues ->
        RecipeScreenContent(
            paddingValues = paddingValues,
            uiState = uiState,
            ingredientOptions = mainViewModel.getIngredientOptions(),
            onIngredientSelectionChanged = { key, selected ->
                mainViewModel.setIngredientSelection(key, selected)
            },
            onGenerateMealDb = { mainViewModel.fetchRecipes() },
            onGenerateAi = { mainViewModel.generateAiRecipe() },
            onShowRawJsonChange = { showRawJson = it },
            showRawJson = showRawJson,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RecipeTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = "Recipes",
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
private fun RecipeScreenContent(
    paddingValues: PaddingValues,
    uiState: MainUiState,
    ingredientOptions: List<IngredientOption>,
    onIngredientSelectionChanged: (String, Boolean) -> Unit,
    onGenerateMealDb: () -> Unit,
    onGenerateAi: () -> Unit,
    onShowRawJsonChange: (Boolean) -> Unit,
    showRawJson: Boolean,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = spacing.large, vertical = spacing.medium)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(spacing.large)
    ) {
        Text(
            text = "Select ingredients to explore recipes.",
            style = MaterialTheme.typography.bodyLarge
        )

        IngredientSelectionSection(
            ingredientOptions = ingredientOptions,
            uiState = uiState,
            onIngredientSelectionChanged = onIngredientSelectionChanged
        )

        ActionButtonsSection(
            uiState = uiState,
            onGenerateMealDb = onGenerateMealDb,
            onGenerateAi = onGenerateAi
        )

        uiState.recipeError?.let { error ->
            ErrorText(message = error)
        }

        uiState.aiError?.let { error ->
            ErrorText(message = error)
        }

        if (uiState.isFetchingRecipes) {
            LoadingRow(label = "Fetching recipes...")
        }

        if (uiState.isGeneratingAiRecipe) {
            LoadingRow(label = "Generating AI recipe...")
        }

        when {
            uiState.recipeSummaries.isNotEmpty() -> {
                MealDbResultsSection(uiState = uiState)
                uiState.recipesJson?.let { json ->
                    RawJsonSection(
                        json = json,
                        showRawJson = showRawJson,
                        onToggle = onShowRawJsonChange,
                        source = uiState.recipeSource
                    )
                }
            }
            uiState.aiRecipe != null -> {
                uiState.aiRecipe?.let { aiRecipeText ->
                    AiRecipeSection(
                        uiState = uiState,
                        aiRecipe = aiRecipeText,
                    )
                }
            }
        }
    }
}

@Composable
private fun IngredientSelectionSection(
    ingredientOptions: List<IngredientOption>,
    uiState: MainUiState,
    onIngredientSelectionChanged: (String, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing.small)
    ) {
        ingredientOptions.forEach { option ->
            val isSelected = uiState.selectedIngredientKeys.contains(option.key)
            val buttonColors = if (isSelected) {
                ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurface
                )
            }

            Button(
                onClick = { onIngredientSelectionChanged(option.key, !isSelected) },
                colors = buttonColors
            ) {
                Text(
                    text = option.displayName,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun ActionButtonsSection(
    uiState: MainUiState,
    onGenerateMealDb: () -> Unit,
    onGenerateAi: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        Button(
            onClick = onGenerateMealDb,
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isFetchingRecipes &&
                !uiState.isGeneratingAiRecipe &&
                uiState.selectedIngredientKeys.isNotEmpty()
        ) {
            Text(
                text = if (uiState.isFetchingRecipes) {
                    "Fetching recipes..."
                } else {
                    "Generate with TheMealDB"
                }
            )
        }

        Button(
            onClick = onGenerateAi,
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isGeneratingAiRecipe &&
                !uiState.isFetchingRecipes &&
                uiState.selectedIngredientKeys.isNotEmpty()
        ) {
            Text(
                text = if (uiState.isGeneratingAiRecipe) {
                    "Generating AI recipe..."
                } else {
                    "Generate with Gemini AI"
                }
            )
        }
    }
}

@Composable
private fun MealDbResultsSection(
    uiState: MainUiState,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        Text(
            text = "Suggested Recipes",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )

        if (uiState.recipeIngredients.isNotEmpty()) {
            Text(
                text = "Ingredients: ${uiState.recipeIngredients.joinToString(", ")}",
                style = MaterialTheme.typography.bodyMedium
            )
        }

        uiState.recipeSummaries.forEach { meal ->
            RecipeCard(
                mealName = meal.strMeal,
                mealId = meal.idMeal,
                thumbnailUrl = meal.strMealThumb
            )
        }
    }
}

@Composable
private fun RawJsonSection(
    json: String,
    showRawJson: Boolean,
    onToggle: (Boolean) -> Unit,
    source: String?,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth()
    ) {
        TextButton(onClick = { onToggle(!showRawJson) }) {
            Text(
                text = if (showRawJson) "Hide Raw JSON" else "Show Raw JSON",
                style = MaterialTheme.typography.labelLarge
            )
        }

        if (showRawJson) {
            SelectionContainer {
                Text(
                    text = json,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        source?.let { src ->
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Source: $src",
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}

@Composable
private fun AiRecipeSection(
    uiState: MainUiState,
    aiRecipe: String,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        Text(
            text = "Gemini Suggestion",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )

        if (uiState.aiIngredients.isNotEmpty()) {
            Text(
                text = "Ingredients: ${uiState.aiIngredients.joinToString(", ")}",
                style = MaterialTheme.typography.bodyMedium
            )
        }

        uiState.aiModel?.let { model ->
            Text(
                text = "Model: $model",
                style = MaterialTheme.typography.labelSmall
            )
        }

        SelectionContainer {
            Text(
                text = aiRecipe,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun RecipeCard(
    mealName: String,
    mealId: String,
    thumbnailUrl: String?,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = mealName,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Meal ID: $mealId",
                style = MaterialTheme.typography.labelMedium
            )

            thumbnailUrl?.takeIf { it.isNotBlank() }?.let { url ->
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Image: $url",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun LoadingRow(
    label: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        CircularProgressIndicator(modifier = Modifier.height(24.dp))
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun ErrorText(
    message: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = message,
        color = MaterialTheme.colorScheme.error,
        style = MaterialTheme.typography.bodyMedium,
        modifier = modifier
    )
}
