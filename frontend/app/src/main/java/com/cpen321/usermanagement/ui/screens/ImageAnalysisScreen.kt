package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.usermanagement.data.model.FoodDetectionResult
import com.cpen321.usermanagement.services.ComputerVisionService
import kotlinx.coroutines.launch

@Composable
fun ImageAnalysisScreen(
    imageBitmap: android.graphics.Bitmap,
    detectionResult: FoodDetectionResult,
    onRetakePhoto: () -> Unit,
    onConfirmFood: (String) -> Unit,
    onClose: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isProcessing by remember { mutableStateOf(false) }
    var selectedFoodItem by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onClose) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Food Analysis",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }
        
        // Image Preview
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            androidx.compose.foundation.Image(
                bitmap = imageBitmap.asImageBitmap(),
                contentDescription = "Captured food image",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentScale = ContentScale.Crop
            )
        }
        
        // Analysis Results
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (detectionResult.isFood) 
                    MaterialTheme.colorScheme.primaryContainer 
                else 
                    MaterialTheme.colorScheme.errorContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (detectionResult.isFood) Icons.Default.Check else Icons.Default.Close,
                        contentDescription = null,
                        tint = if (detectionResult.isFood) 
                            MaterialTheme.colorScheme.primary 
                        else 
                            MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (detectionResult.isFood) "Food Detected!" else "Non-Food Item",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (detectionResult.isFood) 
                            MaterialTheme.colorScheme.primary 
                        else 
                            MaterialTheme.colorScheme.error
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Confidence: ${(detectionResult.confidence * 100).toInt()}%",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                if (detectionResult.detectedLabels.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Detected labels:",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    detectionResult.detectedLabels.take(5).forEach { label ->
                        Text(
                            text = "• ${label.text} (${(label.confidence * 100).toInt()}%)",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                    }
                }
            }
        }
        
        // Action Buttons
        if (detectionResult.isFood) {
            // Food detected - show suggested items
            if (detectionResult.suggestedFoodItems.isNotEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Suggested Food Items:",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        detectionResult.suggestedFoodItems.forEach { foodItem ->
                            OutlinedButton(
                                onClick = { selectedFoodItem = foodItem },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (selectedFoodItem == foodItem) 
                                        MaterialTheme.colorScheme.primaryContainer 
                                    else 
                                        MaterialTheme.colorScheme.surface
                                )
                            ) {
                                Text(foodItem)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Button(
                            onClick = { 
                                if (selectedFoodItem.isNotEmpty()) {
                                    onConfirmFood(selectedFoodItem)
                                }
                            },
                            enabled = selectedFoodItem.isNotEmpty() && !isProcessing,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (isProcessing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                            }
                            Text("Add to Fridge")
                        }
                    }
                }
            } else {
                // Food detected but no specific suggestions
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Food detected but no specific items identified.",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = selectedFoodItem,
                            onValueChange = { selectedFoodItem = it },
                            label = { Text("Enter food item name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Button(
                            onClick = { 
                                if (selectedFoodItem.isNotEmpty()) {
                                    onConfirmFood(selectedFoodItem)
                                }
                            },
                            enabled = selectedFoodItem.isNotEmpty() && !isProcessing,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (isProcessing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                            }
                            Text("Add to Fridge")
                        }
                    }
                }
            }
        } else {
            // Non-food item detected
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "This doesn't appear to be a food item.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Please try taking a photo of a food item instead.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
        
        // Action Buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onRetakePhoto,
                modifier = Modifier.weight(1f)
            ) {
                Text("Retake Photo")
            }
            
            Button(
                onClick = onClose,
                modifier = Modifier.weight(1f)
            ) {
                Text("Cancel")
            }
        }
    }
}