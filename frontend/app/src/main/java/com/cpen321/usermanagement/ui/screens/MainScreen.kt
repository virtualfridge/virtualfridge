package com.cpen321.usermanagement.ui.screens

import Icon
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.theme.LocalFontSizes
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.MainUiState
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

@Composable
fun MainScreen(
    mainViewModel: MainViewModel,
    onProfileClick: () -> Unit
) {
    val uiState by mainViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }

    // Scanner state handled inside MainScreen
    var showScanner by remember { mutableStateOf(false) }

    MainContent(
        uiState = uiState,
        snackBarHostState = snackBarHostState,
        onProfileClick = onProfileClick,
        showScanner = showScanner,
        onScanRequested = { showScanner = true },
        onBarcodeDetected = { barcode ->
            showScanner = false
            mainViewModel.handleScannedBarcode(barcode)
        },
        onSuccessMessageShown = mainViewModel::clearSuccessMessage,
        onErrorMessageShown = mainViewModel::clearScanError,
        mainViewModel = mainViewModel // <-- pass here
    )
}

@Composable
private fun MainContent(
    uiState: MainUiState,
    snackBarHostState: SnackbarHostState,
    onProfileClick: () -> Unit,
    showScanner: Boolean,
    onScanRequested: () -> Unit,
    onBarcodeDetected: (String) -> Unit,
    onSuccessMessageShown: () -> Unit,
    onErrorMessageShown: () -> Unit,
    mainViewModel: MainViewModel, // <-- add this
    modifier: Modifier = Modifier

) {
    Scaffold(
        modifier = modifier,
        topBar = { MainTopBar(onProfileClick = onProfileClick) },
        snackbarHost = {
            MainSnackbarHost(
                hostState = snackBarHostState,
                successMessage = uiState.successMessage,
                errorMessage = uiState.scanError,
                onSuccessMessageShown = onSuccessMessageShown,
                onErrorMessageShown = onErrorMessageShown
            )
        }
    ) { paddingValues ->
        MainBody(
            paddingValues = paddingValues,
            showScanner = showScanner,
            onScanClick = onScanRequested,
            onBarcodeDetected = onBarcodeDetected,
            mainViewModel = mainViewModel
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
private fun MainBody(
    paddingValues: PaddingValues,
    showScanner: Boolean,
    onScanClick: () -> Unit,
    onBarcodeDetected: (String) -> Unit,
    modifier: Modifier = Modifier,
    mainViewModel: MainViewModel
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues),
        contentAlignment = Alignment.Center
    ) {
        if (showScanner) {
            ScannerScreen(
                onBarcodeDetected = onBarcodeDetected,
                onClose = { /* Could toggle showScanner false here if needed */ }
            )
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                WelcomeMessage()
                Spacer(modifier = Modifier.height(16.dp))

                // Scan Barcode Button
                Button(onClick = onScanClick) {
                    Text("Scan Barcode")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Test Barcode Button
                Button(
                    onClick = {
                        val testBarcode = "3017620425035" // Example barcode
                        mainViewModel.handleScannedBarcode(testBarcode)
                    }
                ) {
                    Text("Send Test Barcode")
                }
            }
        }
    }
}


@Composable
private fun WelcomeMessage(modifier: Modifier = Modifier) {
    val fontSizes = LocalFontSizes.current

    Text(
        text = stringResource(R.string.welcome),
        style = MaterialTheme.typography.bodyLarge,
        fontSize = fontSizes.extraLarge3,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier
    )
}
