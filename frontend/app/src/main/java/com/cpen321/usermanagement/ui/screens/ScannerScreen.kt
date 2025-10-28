package com.cpen321.usermanagement.ui.screens

import Icon
import android.annotation.SuppressLint
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody

@Composable
fun ScannerScreen(
    onBarcodeDetected: (String) -> Unit,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    var barcodeDetected by remember { mutableStateOf(false) }
    var scanMode by remember { mutableStateOf(ScanMode.BARCODE) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = androidx.camera.core.Preview.Builder().build()
                    preview.setSurfaceProvider(previewView.surfaceProvider)

                    val barcodeScanner = BarcodeScanning.getClient()

                    val analysisUseCase = ImageAnalysis.Builder()
                        .build()
                        .also { analysis ->
                            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                if (scanMode == ScanMode.BARCODE) {
                                    processImageProxy(
                                        scanner = barcodeScanner,
                                        imageProxy = imageProxy,
                                        onBarcodeDetected = { barcode ->
                                            if (!barcodeDetected) {
                                                barcodeDetected = true
                                                onBarcodeDetected(barcode)
                                            }
                                        }
                                    )
                                } else {
                                    imageProxy.close()
                                }
                            }
                        }

                    val capture = ImageCapture.Builder().build()
                    imageCapture = capture

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            context as androidx.lifecycle.LifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            analysisUseCase,
                            capture
                        )
                    } catch (e: Exception) {
                        Log.e("ScannerScreen", "Camera bind failed", e)
                    }
                }, ContextCompat.getMainExecutor(ctx))

                previewView
            }
        )

        // Back button overlay
        IconButton(
            onClick = onClose,
            modifier = Modifier
                .align(Alignment.TopStart)
                .statusBarsPadding()
                .padding(16.dp),
            colors = IconButtonDefaults.iconButtonColors(
                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
                contentColor = MaterialTheme.colorScheme.onSurface
            )
        ) {
            Icon(name = R.drawable.ic_arrow_back)
        }

        // Toggle control at bottom (above nav bar)
        ModeToggle(
            mode = scanMode,
            onModeChange = { newMode ->
                scanMode = newMode
                if (newMode == ScanMode.BARCODE) {
                    barcodeDetected = false
                }
            },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
        )

        // Camera capture button appears only in Vision mode
        if (scanMode == ScanMode.VISION) {
            FloatingActionButton(
                onClick = {
                    val captureUseCase = imageCapture
                    if (captureUseCase == null) {
                        Log.w("ScannerScreen", "ImageCapture not ready")
                        return@FloatingActionButton
                    }

                    val photoFile = createTempImageFile(context.cacheDir)
                    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

                    captureUseCase.takePicture(
                        outputOptions,
                        cameraExecutor,
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onError(exception: ImageCaptureException) {
                                Log.e("ScannerScreen", "Photo capture failed: ${exception.message}", exception)
                                try { photoFile.delete() } catch (_: Exception) {}
                            }

                            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                                Log.d("ScannerScreen", "Photo capture succeeded: ${photoFile.absolutePath}")
                                // Send to backend in IO thread
                                scope.launch(Dispatchers.IO) {
                                    try {
                                        uploadImageToBackend(photoFile)
                                    } catch (e: Exception) {
                                        Log.e("ScannerScreen", "Upload failed", e)
                                    } finally {
                                        try { photoFile.delete() } catch (_: Exception) {}
                                    }
                                }
                            }
                        }
                    )
                },
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 96.dp),
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                androidx.compose.material3.Icon(
                    painter = painterResource(id = android.R.drawable.ic_menu_camera),
                    contentDescription = null,
                )
            }
        }
    }
}

@SuppressLint("UnsafeOptInUsageError")
private fun processImageProxy(
    scanner: com.google.mlkit.vision.barcode.BarcodeScanner,
    imageProxy: ImageProxy,
    onBarcodeDetected: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    barcode.rawValue?.let { value ->
                        onBarcodeDetected(value)
                    }
                }
            }
            .addOnFailureListener { e -> Log.e("ScannerScreen", "Barcode scan failed", e) }
            .addOnCompleteListener { imageProxy.close() }
    } else {
        imageProxy.close()
    }
}

private fun createTempImageFile(cacheDir: File): File {
    val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    return File.createTempFile("scan_${'$'}timeStamp", ".jpg", cacheDir)
}

private suspend fun uploadImageToBackend(file: File) {
    try {
        val requestBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("media", file.name, requestBody)
        val response = RetrofitClient.imageInterface.uploadPicture("", part)
        if (response.isSuccessful) {
            Log.d("ScannerScreen", "Image uploaded successfully")
        } else {
            Log.e("ScannerScreen", "Image upload failed: ${'$'}{response.errorBody()?.string()}")
        }
    } catch (e: Exception) {
        Log.e("ScannerScreen", "Upload exception", e)
    }
}

enum class ScanMode { BARCODE, VISION }

@Composable
private fun ModeToggle(
    mode: ScanMode,
    onModeChange: (ScanMode) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            ToggleIconButton(
                isSelected = mode == ScanMode.BARCODE,
                onClick = { onModeChange(ScanMode.BARCODE) },
                iconRes = android.R.drawable.ic_menu_sort_by_size // placeholder for barcode icon
            )

            Spacer(modifier = Modifier.width(12.dp))

            ToggleIconButton(
                isSelected = mode == ScanMode.VISION,
                onClick = { onModeChange(ScanMode.VISION) },
                iconRes = android.R.drawable.ic_menu_view // placeholder for vision icon
            )
        }
    }
}

@Composable
private fun ToggleIconButton(
    isSelected: Boolean,
    onClick: () -> Unit,
    iconRes: Int,
    modifier: Modifier = Modifier
) {
    val backgroundColor = if (isSelected) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.surfaceVariant
    }
    val contentColor = if (isSelected) {
        MaterialTheme.colorScheme.onPrimary
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }

    IconButton(
        onClick = onClick,
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(backgroundColor),
        colors = IconButtonDefaults.iconButtonColors(
            containerColor = backgroundColor,
            contentColor = contentColor
        )
    ) {
        androidx.compose.material3.Icon(
            painter = painterResource(id = iconRes),
            contentDescription = null,
            modifier = Modifier.size(24.dp),
            tint = contentColor
        )
    }
}
