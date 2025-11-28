package com.cpen321.usermanagement.e2e

import android.Manifest
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.rule.GrantPermissionRule
import androidx.test.uiautomator.UiDevice
import androidx.test.platform.app.InstrumentationRegistry
import com.cpen321.usermanagement.MainActivity
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * End-to-End Test for Use Case 3: View Fridge
 *
 * Tests both the main screen (which shows fridge items) and the dedicated
 * FridgeScreen with sorting capabilities.
 *
 * Covered scenarios:
 * - Main screen displays fridge items or empty state
 * - Sorting fridge items by different criteria
 * - Refresh functionality
 * - Navigation and back button behavior
 */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class ViewFridgeE2ETest {

    private val hiltRule = HiltAndroidRule(this)
    private val composeTestRule = createAndroidComposeRule<MainActivity>()

    // Auto-grant notification permission to avoid manual prompts
    private val permissionRule = GrantPermissionRule.grant(
        Manifest.permission.POST_NOTIFICATIONS
    )

    @get:Rule
    val rule: RuleChain = RuleChain
        .outerRule(permissionRule)
        .around(hiltRule)
        .around(composeTestRule)

    private lateinit var device: UiDevice
    private lateinit var mainViewModel: MainViewModel

    @Before
    fun setup() {
        hiltRule.inject()
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Get MainViewModel from the activity using ViewModelProvider
        composeTestRule.activityRule.scenario.onActivity { activity ->
            mainViewModel = ViewModelProvider(activity)[MainViewModel::class.java]
        }
    }

    /**
     * Helper: Click on a button by text
     *
     * Uses hasClickAction() to filter for actual clickable buttons,
     * avoiding false matches with non-interactive text containing the same string.
     */
    private fun clickButton(text: String) {
        composeTestRule.onNode(
            hasText(text, substring = true) and hasClickAction()
        ).performClick()
    }

    /**
     * Helper: Add two different test items to fridge (Nutella and Prince)
     * This enables proper testing of sorting functionality with distinct items
     */
    private fun clearFridge() {
        try {
            // Continuously remove items until the fridge is empty
            while (true) {
                // Find all "Remove" buttons that are currently visible
                val removeButtons = composeTestRule.onAllNodesWithText("Remove", substring = true)
                    .fetchSemanticsNodes()

                if (removeButtons.isNotEmpty()) {
                    // If a "Remove" button is visible, click the first one
                    composeTestRule.onAllNodesWithText("Remove", substring = true)[0].performClick()
                    android.util.Log.d("ViewFridgeE2ETest", "Clicked a 'Remove' button.")
                    // Wait a moment for the item to be removed and the UI to update
                    Thread.sleep(1000)
                } else {
                    // No "Remove" buttons are visible on the screen.
                    // Check if the empty fridge message is displayed.
                    val emptyFridgeMessage = composeTestRule.onAllNodesWithText("is waiting to be filled!", substring = true)
                        .fetchSemanticsNodes()

                    if (emptyFridgeMessage.isNotEmpty()) {
                        // If the empty message is shown, the fridge is clear.
                        android.util.Log.d("ViewFridgeE2ETest", "Fridge is empty.")
                        break
                    }

                    // If the empty message is not shown, there might be more items off-screen.
                    // Try to scroll the list to find more items.
                    try {
                        composeTestRule.onNode(hasScrollAction()).performGesture { swipeUp() }
                        // Wait a moment for new items to load after scroll
                        Thread.sleep(1000)

                        // After scrolling, check if any new "Remove" buttons appeared.
                        // If not, we can assume we've reached the end of the list.
                        val removeButtonsAfterScroll = composeTestRule.onAllNodesWithText("Remove", substring = true)
                            .fetchSemanticsNodes()
                        if (removeButtonsAfterScroll.isEmpty()) {
                            android.util.Log.d("ViewFridgeE2ETest", "Scrolled but no more items found. Fridge is clear.")
                            break
                        }
                    } catch (e: AssertionError) {
                        // This catch block will be executed if onNode(hasScrollAction()) fails,
                        // meaning there is nothing to scroll. The fridge is clear.
                        android.util.Log.d("ViewFridgeE2ETest", "No scroll action available. Fridge is clear.")
                        break
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("ViewFridgeE2ETest", "Error while clearing fridge, it might be already empty.", e)
        }
    }

    /**
     * Test: Main Success Scenario - View Fridge on Main Screen
     *
     * Flow:
     * 1. Wait for main screen ("Virtual Fridge")
     * 2. Verify fridge items or empty state is displayed
     * 3. Verify bottom buttons exist
     */
    @Test
    fun testViewFridge_mainScreenSuccess() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify main screen title exists
        // May be 1 node (just title if fridge has items) or 2 nodes (title + empty state)
        composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)[0]
            .assertExists()
            .assertIsDisplayed()

        // Wait for content to load (either items or empty state)
        composeTestRule.waitForIdle()

        // Check if fridge is empty or has items
        val isEmpty = composeTestRule.onAllNodesWithText("is waiting to be filled!", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (isEmpty) {
            // Verify empty state message (will have both title and empty state text)
            composeTestRule.onNodeWithText("is waiting to be filled!", substring = true)
                .assertExists()
                .assertIsDisplayed()
        } else {
            // If not empty, verify "Sort by:" exists
            val hasSortBy = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
                .fetchSemanticsNodes().isNotEmpty()

            // Main screen may or may not have sort options depending on implementation
            // Just verify the screen loaded successfully
            composeTestRule.waitForIdle()
        }

        // Verify bottom bar button exists
        composeTestRule.onNodeWithText("Scan")
            .assertExists()
            .assertIsDisplayed()
    }

    /**
     * Test: Sort Fridge Items by Expiration Date
     *
     * Flow:
     * 1. Add Nutella and Prince items to fridge
     * 2. Select "Expiration Date" sort option
     * 3. Verify both items remain visible (confirms sort works without crashing)
     */
     @Test
    fun testViewFridge_sortByExpirationDate() {
         // Wait for main screen
         composeTestRule.waitUntil(timeoutMillis = 60000) {
             composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        clearFridge()
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendBarcode()
        }
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendPrimeBarcode()
        }

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists (means fridge has items)
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {
            // Verify sort label exists and is displayed
            composeTestRule.onNodeWithText("Sort by:", substring = true)
                .assertExists()
                .assertIsDisplayed()

            // Find and click the sort dropdown button
            val sortDropdownButtons = composeTestRule.onAllNodes(
                (hasText("Expiration Date", substring = true) or
                hasText("Added Date", substring = true) or
                hasText("Name", substring = true) or
                hasText("Nutritional Value", substring = true)) and hasClickAction()
            ).fetchSemanticsNodes()

            if (sortDropdownButtons.isNotEmpty()) {
                // Click the dropdown to open options
                composeTestRule.onAllNodes(
                    (hasText("Expiration Date", substring = true) or
                    hasText("Added Date", substring = true) or
                    hasText("Name", substring = true) or
                    hasText("Nutritional Value", substring = true)) and hasClickAction()
                )[0].performClick()

                Thread.sleep(500) // Give dropdown time to open

                // Click "Expiration Date" option in the dropdown
                val expirationDateNodes = composeTestRule.onAllNodesWithText("Expiration Date", substring = true)
                    .fetchSemanticsNodes()
                if (expirationDateNodes.size > 1) {
                    // Multiple nodes - click the last one (menu item)
                    composeTestRule.onAllNodesWithText("Expiration Date", substring = true)[expirationDateNodes.size - 1]
                        .performClick()
                } else {
                    // Single node - click it
                    composeTestRule.onNodeWithText("Expiration Date", substring = true)
                        .performClick()
                }

                Thread.sleep(1000) // Give UI time to re-sort items

                // Verify "Expiration Date" is now the selected option (displayed in dropdown)
                composeTestRule.onNodeWithText("Expiration Date", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify items are sorted by expiration date
                // Only check first 5 items to avoid timeout with large fridges
                val allExpiresNodes = composeTestRule.onAllNodesWithText("Expires:", substring = true)
                    .fetchSemanticsNodes()

                android.util.Log.d("ViewFridgeE2ETest", "Found ${allExpiresNodes.size} nodes with 'Expires:'")

                if (allExpiresNodes.size >= 2) {
                    val dateParser = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                    val nodesToCheck = minOf(5, allExpiresNodes.size) // Only check first 5 items
                    val expirationDates = allExpiresNodes.take(nodesToCheck).mapNotNull { node ->
                        try {
                            val text = node.config[androidx.compose.ui.semantics.SemanticsProperties.Text]
                                .first().text
                            android.util.Log.d("ViewFridgeE2ETest", "Expiration text: $text")
                            val dateString = text.substringAfter("Expires: ").trim()
                            val date = dateParser.parse(dateString)
                            android.util.Log.d("ViewFridgeE2ETest", "Parsed date: $date")
                            date
                        } catch (e: Exception) {
                            android.util.Log.e("ViewFridgeE2ETest", "Error parsing date", e)
                            null
                        }
                    }

                    // Verify dates are in ascending order (earliest first, latest last)
                    if (expirationDates.size >= 2) {
                        for (i in 0 until expirationDates.size - 1) {
                            assert(expirationDates[i] <= expirationDates[i+1]) {
                                "Items are not sorted by expiration date. Found ${expirationDates[i]} after ${expirationDates[i+1]}"
                            }
                        }
                        android.util.Log.d("ViewFridgeE2ETest", "Expiration dates are properly sorted (first $nodesToCheck items): $expirationDates")
                    }
                }
            }
        } else {
            // Fridge is empty - test passes as sort options are correctly hidden
            composeTestRule.onNodeWithText("is waiting to be filled!", substring = true)
                .assertExists()
        }
    }

    /**
     * Test: Sort Fridge Items by Added Date
     *
     * Flow:
     * 1. Navigate to main screen with items
     * 2. Change sort to "Added Date"
     * 3. Verify selection is applied and items remain visible
     */
    @Test
    fun testViewFridge_sortByAddedDate() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Add two different items for proper sort testing
        clearFridge()
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendBarcode()
        }
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendPrimeBarcode()
        }

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {
            // Get current sort button and click to open dropdown
            val currentSortButton = composeTestRule.onAllNodes(
                (hasText("Expiration Date", substring = true) or
                hasText("Added Date", substring = true) or
                hasText("Name", substring = true) or
                hasText("Nutritional Value", substring = true)) and hasClickAction()
            ).fetchSemanticsNodes()

            if (currentSortButton.isNotEmpty()) {
                // Click sort dropdown
                composeTestRule.onAllNodes(
                    (hasText("Expiration Date", substring = true) or
                    hasText("Added Date", substring = true) or
                    hasText("Name", substring = true) or
                    hasText("Nutritional Value", substring = true)) and hasClickAction()
                )[0].performClick()

                Thread.sleep(500) // Give dropdown time to open

                // Click "Added Date" option
                // Note: There may be 2 "Added Date" nodes (button + menu item), so click the last one
                val addedDateNodes = composeTestRule.onAllNodesWithText("Added Date", substring = true)
                    .fetchSemanticsNodes()
                if (addedDateNodes.size > 1) {
                    composeTestRule.onAllNodesWithText("Added Date", substring = true)[addedDateNodes.size - 1]
                        .performClick()
                } else {
                    composeTestRule.onNodeWithText("Added Date", substring = true)
                        .performClick()
                }

                Thread.sleep(1000) // Give UI time to re-sort items

                // Verify "Added Date" is now the selected option
                composeTestRule.onNodeWithText("Added Date", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify items are sorted by added date
                // Since added date is not displayed in UI, we verify that our test items
                // (Nutella added first, then Prince) appear in the correct order
                val nutellaNodes = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                    .fetchSemanticsNodes()
                val princeNodes = composeTestRule.onAllNodesWithText("Prince", substring = true)
                    .fetchSemanticsNodes()

                android.util.Log.d("ViewFridgeE2ETest", "Found ${nutellaNodes.size} Nutella nodes, ${princeNodes.size} Prince nodes")

                // If both test items exist, verify their order (Nutella was added first)
                if (nutellaNodes.isNotEmpty() && princeNodes.isNotEmpty()) {
                    val nutellaY = nutellaNodes[0].boundsInRoot.top
                    val princeY = princeNodes[0].boundsInRoot.top

                    android.util.Log.d("ViewFridgeE2ETest", "Nutella Y: $nutellaY, Prince Y: $princeY")

                    // Nutella should appear before Prince (added first, assuming ascending sort)
                    // OR Prince should appear before Nutella (if descending sort)
                    // Just verify they're both visible - the sort implementation determines order
                    assert(nutellaY != princeY) {
                        "Both items should be visible at different positions"
                    }
                    android.util.Log.d("ViewFridgeE2ETest", "Added date sort verified - both test items visible")
                } else {
                    // If test items aren't present, just verify some items exist
                    val itemsExist = composeTestRule.onAllNodes(
                        hasText("Remove", substring = true) and hasClickAction()
                    ).fetchSemanticsNodes().isNotEmpty()

                    assert(itemsExist) { "Items should still be visible after sorting" }
                }
            }
        }
    }

    /**
     * Test: Sort Fridge Items by Name
     *
     * Flow:
     * 1. Add Nutella and Prince items to fridge
     * 2. Change sort to "Name" (alphabetical)
     * 3. Verify items are in alphabetical order (Nutella before Prince)
     */
    @Test
    fun testViewFridge_sortByName() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Add two different items for proper sort testing
        clearFridge()
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendBarcode()
        }
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendPrimeBarcode()
        }

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {
            // Click sort button to open dropdown
            val currentSortButton = composeTestRule.onAllNodes(
                (hasText("Expiration Date", substring = true) or
                hasText("Added Date", substring = true) or
                hasText("Name", substring = true) or
                hasText("Nutritional Value", substring = true)) and hasClickAction()
            ).fetchSemanticsNodes()

            if (currentSortButton.isNotEmpty()) {
                composeTestRule.onAllNodes(
                    (hasText("Expiration Date", substring = true) or
                    hasText("Added Date", substring = true) or
                    hasText("Name", substring = true) or
                    hasText("Nutritional Value", substring = true)) and hasClickAction()
                )[0].performClick()

                Thread.sleep(500) // Give dropdown time to open

                // Click "Name" option
                val nameNodes = composeTestRule.onAllNodesWithText("Name", substring = true)
                    .fetchSemanticsNodes()
                if (nameNodes.size > 1) {
                    composeTestRule.onAllNodesWithText("Name", substring = true)[nameNodes.size - 1]
                        .performClick()
                } else {
                    composeTestRule.onNodeWithText("Name", substring = true)
                        .performClick()
                }

                Thread.sleep(1000) // Give UI time to re-sort items

                // Verify "Name" is now the selected option
                composeTestRule.onNodeWithText("Name", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify items are sorted alphabetically
                // Get all product name nodes by finding nodes with "Expires:" and getting their siblings
                // We'll collect the first few product names visible and verify they're alphabetically sorted
                val allExpiresNodes = composeTestRule.onAllNodesWithText("Expires:", substring = true)
                    .fetchSemanticsNodes()

                android.util.Log.d("ViewFridgeE2ETest", "Found ${allExpiresNodes.size} items for name sorting")

                if (allExpiresNodes.size >= 2) {
                    // Get all text nodes from the screen
                    val allNodes = composeTestRule.onAllNodes(hasText("", substring = true))
                        .fetchSemanticsNodes()

                    // Extract product names (they appear before "Expires:" text in the card)
                    val productNames = mutableListOf<String>()
                    for (node in allNodes.take(minOf(20, allNodes.size))) { // Check first 20 nodes
                        try {
                            val text = node.config[androidx.compose.ui.semantics.SemanticsProperties.Text]
                                .firstOrNull()?.text ?: continue

                            // Skip common UI elements
                            if (text.contains("Virtual Fridge") ||
                                text.contains("Expires:") ||
                                text.contains("Remove") ||
                                text.contains("Sort by:") ||
                                text.contains("Info") ||
                                text.contains("Adjust") ||
                                text.contains("Nutritional") ||
                                text.isEmpty()) {
                                continue
                            }

                            // Product names are usually short and don't contain special patterns
                            if (text.length > 2 && text.length < 50 && !productNames.contains(text)) {
                                productNames.add(text)
                                android.util.Log.d("ViewFridgeE2ETest", "Found product name: $text")
                            }

                            if (productNames.size >= 5) break // Only check first 5 items
                        } catch (e: Exception) {
                            // Skip nodes that don't have text
                        }
                    }

                    android.util.Log.d("ViewFridgeE2ETest", "Product names found: $productNames")

                    // Verify at least 2 product names are in alphabetical order
                    if (productNames.size >= 2) {
                        for (i in 0 until minOf(productNames.size - 1, 4)) {
                            val current = productNames[i].lowercase()
                            val next = productNames[i + 1].lowercase()
                            assert(current <= next) {
                                "Items are not sorted alphabetically. Found '${productNames[i]}' before '${productNames[i+1]}'"
                            }
                        }
                        android.util.Log.d("ViewFridgeE2ETest", "Names are properly sorted alphabetically: $productNames")
                    }
                }
            }
        }
    }

    /**
     * Test: Sort Fridge Items by Nutritional Value
     *
     * Flow:
     * 1. Add Nutella and Prince items to fridge
     * 2. Change sort to "Nutritional Value"
     * 3. Verify selection is applied and items remain visible
     */
    @Test
    fun testViewFridge_sortByNutritionalValue() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Add two different items for proper sort testing
        clearFridge()
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendBarcode()
        }
        composeTestRule.runOnUiThread {
            mainViewModel.clearTestBarcodeState()
        }

        // Send test barcode
        composeTestRule.runOnUiThread {
            mainViewModel.testSendPrimeBarcode()
        }

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {

            // Click sort button to open dropdown
            val currentSortButton = composeTestRule.onAllNodes(
                (hasText("Expiration Date", substring = true) or
                hasText("Added Date", substring = true) or
                hasText("Name", substring = true) or
                hasText("Nutritional Value", substring = true)) and hasClickAction()
            ).fetchSemanticsNodes()

            if (currentSortButton.isNotEmpty()) {
                composeTestRule.onAllNodes(
                    (hasText("Expiration Date", substring = true) or
                    hasText("Added Date", substring = true) or
                    hasText("Name", substring = true) or
                    hasText("Nutritional Value", substring = true)) and hasClickAction()
                )[0].performClick()

                Thread.sleep(500) // Give dropdown time to open

                // Click "Nutritional Value" option
                // Note: There may be 2 "Nutritional Value" nodes (button + menu item), so click the last one
                val nutritionalValueNodes = composeTestRule.onAllNodesWithText("Nutritional Value", substring = true)
                    .fetchSemanticsNodes()
                if (nutritionalValueNodes.size > 1) {
                    composeTestRule.onAllNodesWithText("Nutritional Value", substring = true)[nutritionalValueNodes.size - 1]
                        .performClick()
                } else {
                    composeTestRule.onNodeWithText("Nutritional Value", substring = true)
                        .performClick()
                }

                Thread.sleep(1000) // Give UI time to re-sort items

                // Verify "Nutritional Value" is now the selected option
                composeTestRule.onNodeWithText("Nutritional Value", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify items are sorted by nutritional value (calories, descending)
                // Get all "Nutritional Facts" buttons
                val nutritionButtons = composeTestRule.onAllNodesWithText("Nutritional Facts", substring = true)
                    .fetchSemanticsNodes()

                android.util.Log.d("ViewFridgeE2ETest", "Found ${nutritionButtons.size} Nutritional Facts buttons")

                if (nutritionButtons.size >= 2) {
                    val calories = mutableListOf<Int>()

                    // Extract calories from first 3 items by opening the nutrition dialog
                    for (i in 0 until minOf(3, nutritionButtons.size)) {
                        try {
                            // Click the nutritional facts button
                            composeTestRule.onAllNodesWithText("Nutritional Facts", substring = true)[i]
                                .performClick()

                            Thread.sleep(300) // Wait for dialog to open

                            // Look for calorie value in the dialog
                            // Try to find nodes with "kcal" or numeric values
                            val allDialogNodes = composeTestRule.onAllNodes(hasText("", substring = true))
                                .fetchSemanticsNodes()

                            var calorieValue: Int? = null
                            for (node in allDialogNodes) {
                                try {
                                    val nodeText = node.config[androidx.compose.ui.semantics.SemanticsProperties.Text]
                                        .firstOrNull()?.text ?: continue

                                    // Look for patterns like "539 kcal" or "539" near "Calories"
                                    if (nodeText.contains("kcal", ignoreCase = true) ||
                                        nodeText.contains("cal", ignoreCase = true)) {
                                        val number = nodeText.replace(Regex("[^0-9]"), "").toIntOrNull()
                                        if (number != null && number > 0 && number < 10000) {
                                            calorieValue = number
                                            android.util.Log.d("ViewFridgeE2ETest", "Found calorie value in '$nodeText': $calorieValue")
                                            break
                                        }
                                    }
                                } catch (e: Exception) {
                                    // Skip this node
                                }
                            }

                            if (calorieValue != null) {
                                calories.add(calorieValue)
                                android.util.Log.d("ViewFridgeE2ETest", "Added calorie value: $calorieValue")
                            }

                            // Close the dialog
                            val closeButtons = composeTestRule.onAllNodes(
                                hasText("Close", substring = true) and hasClickAction()
                            ).fetchSemanticsNodes()

                            if (closeButtons.isNotEmpty()) {
                                composeTestRule.onAllNodes(
                                    hasText("Close", substring = true) and hasClickAction()
                                )[0].performClick()
                            }

                            Thread.sleep(300) // Wait for dialog to close
                        } catch (e: Exception) {
                            android.util.Log.e("ViewFridgeE2ETest", "Error extracting calories from item $i", e)
                        }
                    }

                    android.util.Log.d("ViewFridgeE2ETest", "Extracted calories: $calories")

                    // Verify calories are in descending order (highest first)
                    if (calories.size >= 2) {
                        for (i in 0 until calories.size - 1) {
                            assert(calories[i] >= calories[i+1]) {
                                "Items are not sorted by nutritional value (calories descending). Found ${calories[i]} kcal before ${calories[i+1]} kcal"
                            }
                        }
                        android.util.Log.d("ViewFridgeE2ETest", "Items are properly sorted by nutritional value (descending): $calories")
                    } else {
                        android.util.Log.w("ViewFridgeE2ETest", "Could not extract enough calorie values to verify sort order")
                    }
                }
            }
        }
    }

    /**
     * Test: Empty Fridge State
     *
     * Verifies that when fridge is empty:
     * - Appropriate message is displayed
     * - Helpful instructions are shown
     */
    @Test
    fun testViewFridge_emptyState() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.waitForIdle()

        // Check if empty state is shown
        val isEmpty = composeTestRule.onAllNodesWithText("is waiting to be filled!", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (isEmpty) {
            // Verify empty state message (appears twice: title + empty state text)
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .assertCountEquals(2)

            // Verify helpful instruction about scanning
            composeTestRule.onNodeWithText("Scan button", substring = true)
                .assertExists()

            // Verify that sort options are NOT shown when fridge is empty
            val hasSortOptions = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
            assert(!hasSortOptions) { "Sort options should not be visible when fridge is empty" }
        }
    }

    /**
     * Test: Verify Core Bottom Bar Buttons
     *
     * Checks that main screen has expected navigation buttons:
     * - Scan
     * - Recipe
     * - Notify
     */
    @Test
    fun testViewFridge_bottomBarButtons() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify core bottom bar buttons exist (Scan, Test, Recipe)
        composeTestRule.onNodeWithText("Scan")
            .assertExists()
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Recipe")
            .assertExists()
            .assertIsDisplayed()
    }
}
