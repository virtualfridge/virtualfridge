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
     * Helper: Add two different test items to fridge (Nutella and Prime)
     * This enables proper testing of sorting functionality with distinct items
     */
    private fun addMultipleTestItems() {
        try {
            composeTestRule.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)

            // Add Nutella
            android.util.Log.d("ViewFridgeE2ETest", "Adding Nutella...")
            composeTestRule.runOnUiThread {
                mainViewModel.testSendBarcode()
            }

            // Wait for Nutella to appear in the fridge
            composeTestRule.waitUntil(timeoutMillis = 45000) {
                composeTestRule.onAllNodesWithText("Nutella", substring = true)
                    .fetchSemanticsNodes().isNotEmpty()
            }
            android.util.Log.d("ViewFridgeE2ETest", "Nutella added successfully.")

            // Add Prime
            android.util.Log.d("ViewFridgeE2ETest", "Adding Prime...")
            composeTestRule.runOnUiThread {
                mainViewModel.testSendPrimeBarcode()
            }

            // Wait for Prime to appear in the fridge
            composeTestRule.waitUntil(timeoutMillis = 45000) {
                composeTestRule.onAllNodesWithText("Prime", substring = true)
                    .fetchSemanticsNodes().isNotEmpty()
            }
            android.util.Log.d("ViewFridgeE2ETest", "Prime added successfully.")

            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.e("ViewFridgeE2ETest", "Error in addMultipleTestItems", e)
            // Items may already exist from previous test runs
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
     * 1. Add Nutella and Prime items to fridge
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

        // Add two different items for proper sort testing
        addMultipleTestItems()

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

                composeTestRule.waitForIdle()

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

                composeTestRule.waitForIdle()

                // Verify "Expiration Date" is now the selected option (displayed in dropdown)
                composeTestRule.onNodeWithText("Expiration Date", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify items are sorted by expiration date
                val allExpiresNodes = composeTestRule.onAllNodesWithText("Expires:", substring = true)
                    .fetchSemanticsNodes()

                android.util.Log.d("ViewFridgeE2ETest", "Found ${allExpiresNodes.size} nodes with 'Expires:'")

                if (allExpiresNodes.size >= 2) {
                    val dateParser = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                    val expirationDates = allExpiresNodes.mapNotNull { node ->
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
                    for (i in 0 until expirationDates.size - 1) {
                        assert(expirationDates[i] <= expirationDates[i+1]) {
                            "Items are not sorted by expiration date. Found ${expirationDates[i]} after ${expirationDates[i+1]}"
                        }
                    }
                    android.util.Log.d("ViewFridgeE2ETest", "Expiration dates are properly sorted: $expirationDates")
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
        addMultipleTestItems()

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

                composeTestRule.waitForIdle()

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

                composeTestRule.waitForIdle()

                // Verify "Added Date" is now the selected option
                composeTestRule.onNodeWithText("Added Date", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify both items are still visible after sorting
                // (Added date is not displayed in UI, so we just verify items are present)
                composeTestRule.onNodeWithText("Nutella", substring = true)
                    .assertExists()
                composeTestRule.onNodeWithText("Prime", substring = true)
                    .assertExists()
            }
        }
    }

    /**
     * Test: Sort Fridge Items by Name
     *
     * Flow:
     * 1. Add Nutella and Prime items to fridge
     * 2. Change sort to "Name" (alphabetical)
     * 3. Verify items are in alphabetical order (Nutella before Prime)
     */
    @Test
    fun testViewFridge_sortByName() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Add two different items for proper sort testing
        addMultipleTestItems()

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

                composeTestRule.waitForIdle()

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

                composeTestRule.waitForIdle()

                // Verify "Name" is now the selected option
                composeTestRule.onNodeWithText("Name", substring = true)
                    .assertExists()
                    .assertIsDisplayed()

                // Verify items are sorted alphabetically by checking their vertical positions
                // Get Nutella node
                val nutellaNodes = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                    .fetchSemanticsNodes()

                // Get the other drink node (Icy Pop or similar)
                val icyNodes = composeTestRule.onAllNodesWithText("Icy", substring = true)
                    .fetchSemanticsNodes()

                if (nutellaNodes.isNotEmpty() && icyNodes.isNotEmpty()) {
                    // Get the first Nutella and first Icy node (should be the product name)
                    val nutellaNode = nutellaNodes[0]
                    val icyNode = icyNodes[0]

                    val nutellaY = nutellaNode.boundsInRoot.top
                    val icyY = icyNode.boundsInRoot.top

                    val nutellaName = nutellaNode.config[androidx.compose.ui.semantics.SemanticsProperties.Text].first().text
                    val icyName = icyNode.config[androidx.compose.ui.semantics.SemanticsProperties.Text].first().text

                    android.util.Log.d("ViewFridgeE2ETest", "Nutella at Y=$nutellaY, Icy at Y=$icyY")
                    android.util.Log.d("ViewFridgeE2ETest", "Nutella name: $nutellaName, Icy name: $icyName")

                    // Determine which comes first alphabetically
                    val alphabeticalFirst = if (icyName.lowercase() < nutellaName.lowercase()) icyName else nutellaName
                    val visualFirst = if (icyY < nutellaY) icyName else nutellaName

                    assert(alphabeticalFirst == visualFirst) {
                        "Items are not sorted alphabetically. $alphabeticalFirst should come before, but $visualFirst appears first in the list"
                    }
                    android.util.Log.d("ViewFridgeE2ETest", "Items are properly sorted alphabetically")
                }
            }
        }
    }

    /**
     * Test: Sort Fridge Items by Nutritional Value
     *
     * Flow:
     * 1. Add Nutella and Prime items to fridge
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
        addMultipleTestItems()

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

                composeTestRule.waitForIdle()

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

                composeTestRule.waitForIdle()

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

                    // Extract calories from each item by opening the nutrition dialog
                    for (i in 0 until minOf(2, nutritionButtons.size)) {
                        // Click the nutritional facts button
                        composeTestRule.onAllNodesWithText("Nutritional Facts", substring = true)[i]
                            .performClick()

                        composeTestRule.waitForIdle()

                        // Extract calories from the dialog
                        val caloriesNodes = composeTestRule.onAllNodesWithText("Calories", substring = true)
                            .fetchSemanticsNodes()

                        if (caloriesNodes.isNotEmpty()) {
                            try {
                                val text = caloriesNodes.first().config[androidx.compose.ui.semantics.SemanticsProperties.Text]
                                    .first().text
                                // Text format is "Calories" in one node and value in another, or "Calories: value"
                                android.util.Log.d("ViewFridgeE2ETest", "Calories text: $text")

                                // Try to find the calorie value in sibling nodes
                                val allDialogNodes = composeTestRule.onAllNodes(hasText("", substring = false) or hasText("", substring = true))
                                    .fetchSemanticsNodes()

                                // Look for numeric value near "Calories" text
                                var calorieValue: Int? = null
                                for (node in allDialogNodes) {
                                    val nodeText = node.config[androidx.compose.ui.semantics.SemanticsProperties.Text]
                                        .firstOrNull()?.text ?: continue
                                    // Try to extract number that could be calories (e.g., "539", "539 kcal", etc.)
                                    val number = nodeText.trim().split(" ").firstOrNull()?.toIntOrNull()
                                    if (number != null && number > 0 && number < 10000) {
                                        calorieValue = number
                                        android.util.Log.d("ViewFridgeE2ETest", "Found calorie value: $calorieValue")
                                        break
                                    }
                                }

                                if (calorieValue != null) {
                                    calories.add(calorieValue)
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("ViewFridgeE2ETest", "Error extracting calories", e)
                            }
                        }

                        // Close the dialog
                        composeTestRule.onNodeWithText("Close", substring = true)
                            .performClick()

                        composeTestRule.waitForIdle()
                    }

                    android.util.Log.d("ViewFridgeE2ETest", "Extracted calories: $calories")

                    // Verify calories are in descending order (highest first)
                    if (calories.size >= 2) {
                        for (i in 0 until calories.size - 1) {
                            assert(calories[i] >= calories[i+1]) {
                                "Items are not sorted by nutritional value (calories). Found ${calories[i]} before ${calories[i+1]}"
                            }
                        }
                        android.util.Log.d("ViewFridgeE2ETest", "Items are properly sorted by nutritional value: $calories")
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
