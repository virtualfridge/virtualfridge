package com.cpen321.usermanagement.ui.components

import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier

data class MessageSnackbarState(
    val successMessage: String?,
    val errorMessage: String?,
    val onSuccessMessageShown: () -> Unit,
    val onErrorMessageShown: () -> Unit
)

@Composable
fun MessageSnackbar(
    hostState: SnackbarHostState,
    messageState: MessageSnackbarState,
    modifier: Modifier = Modifier
) {
    LaunchedEffect(messageState.successMessage) {
        messageState.successMessage?.let { message ->
            hostState.showSnackbar(
                message = message,
                duration = SnackbarDuration.Long
            )
            messageState.onSuccessMessageShown()
        }
    }

    LaunchedEffect(messageState.errorMessage) {
        messageState.errorMessage?.let { message ->
            hostState.showSnackbar(
                message = message,
                duration = SnackbarDuration.Short
            )
            messageState.onErrorMessageShown()
        }
    }

    SnackbarHost(
        hostState = hostState,
        modifier = modifier
    )
}
