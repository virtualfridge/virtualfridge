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
import com.cpen321.usermanagement.data.remote.dto.Recipe
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
            generateActions = GenerateActions(
                onMealDb = { mainViewModel.fetchRecipes() },
                onAi = { mainViewModel.generateAiRecipe() }
            ),
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

private data class GenerateActions(
    val onMealDb: () -> Unit,
    val onAi: () -> Unit,
)

@Composable
private fun RecipeScreenContent(
    paddingValues: PaddingValues,
    uiState: MainUiState,
    ingredientOptions: List<IngredientOption>,
    onIngredientSelectionChanged: (String, Boolean) -> Unit,
    generateActions: GenerateActions,
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
            onGenerateMealDb = generateActions.onMealDb,
            onGenerateAi = generateActions.onAi
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
            uiState.recipe != null -> {
                MealDbResultsSection(uiState = uiState)
                uiState.recipesJson?.let { json ->
                    RawJsonSection(
                        json = json,
                        showRawJson = showRawJson,
                        onToggle = onShowRawJsonChange,
                        source = uiState.recipe.source
                    )
                }
            }

            uiState.aiRecipe != null -> {
                AiRecipeSection(
                    uiState = uiState,
                    aiRecipe = uiState.aiRecipe,
                )
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

        if (uiState.recipe != null) {
            RecipeDetails(recipe = uiState.recipe)
        }
    }
}

@Composable
private fun RecipeDetails(
    recipe: Recipe,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = spacing.medium),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        Text(
            text = recipe.name,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "Ingredients",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )

        Column {
            recipe.ingredients.forEach { ingredient ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = ingredient.name,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = ingredient.measure,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        Text(
            text = "Instructions",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )

        Text(
            text = recipe.instructions,
            style = MaterialTheme.typography.bodyMedium
        )
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
