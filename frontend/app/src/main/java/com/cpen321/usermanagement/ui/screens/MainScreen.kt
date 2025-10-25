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
    onProfileClick: () -> Unit,
    onRecipeClick: () -> Unit,
    onTestBarcodeClick: () -> Unit,
    onBarcodeResultClick: () -> Unit
) {
    val uiState by mainViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }
    var showScanner by remember { mutableStateOf(false) }

    // Navigate to barcode result screen when a barcode is successfully scanned
    LaunchedEffect(uiState.barcodeResult) {
        if (uiState.barcodeResult != null) {
            onBarcodeResultClick()
        }
    }

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
        onRecipeClick = onRecipeClick,
        onTestBarcodeClick = onTestBarcodeClick,
        onTestNotificationClick = mainViewModel::sendTestNotification
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
    onRecipeClick: () -> Unit,
    onTestBarcodeClick: () -> Unit,
    onTestNotificationClick: () -> Unit,
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
            onRecipeClick = onRecipeClick,
            onScanClick = onScanRequested,
            onTestBarcodeClick = onTestBarcodeClick,
            onTestNotificationClick = onTestNotificationClick,
            onBarcodeDetected = onBarcodeDetected,
            uiState = uiState
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
    onRecipeClick: () -> Unit,
    onScanClick: () -> Unit,
    onTestBarcodeClick: () -> Unit,
    onTestNotificationClick: () -> Unit,
    onBarcodeDetected: (String) -> Unit,
    uiState: MainUiState,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues),
        contentAlignment = Alignment.Center
    ) {
        if (showScanner) {
            ScannerScreen(
                onBarcodeDetected = onBarcodeDetected,
                onClose = { /* handled via barcode detection */ }
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = spacing.large),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(spacing.medium)
            ) {
                WelcomeMessage()

                Button(
                    onClick = onRecipeClick,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Recipe")
                }

                Button(
                    onClick = onScanClick,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Scan Barcode")
                }

                Button(
                    onClick = onTestBarcodeClick,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Send Test Barcode")
                }

                Button(
                    onClick = onTestNotificationClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isSendingTestNotification
                ) {
                    Text(if (uiState.isSendingTestNotification) "Sending..." else "Test Expiry Notification")
                }

                uiState.notificationSuccessMessage?.let { message ->
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                uiState.notificationError?.let { error ->
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                uiState.lastScannedBarcode?.let { barcode ->
                    Text(
                        text = "Last scanned barcode: $barcode",
                        style = MaterialTheme.typography.bodyMedium
                    )
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
