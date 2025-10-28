package com.cpen321.usermanagement.ui.screens

import android.annotation.SuppressLint
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

@Composable
fun ScannerScreen(
    onBarcodeDetected: (String) -> Unit,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    var barcodeDetected by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(factory = { ctx ->
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
                        }
                    }

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        context as androidx.lifecycle.LifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        analysisUseCase
                    )
                } catch (e: Exception) {
                    Log.e("ScannerScreen", "Camera bind failed", e)
                }
            }, ContextCompat.getMainExecutor(ctx))

            previewView
        })
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
