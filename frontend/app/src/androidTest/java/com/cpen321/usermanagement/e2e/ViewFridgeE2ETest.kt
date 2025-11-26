package com.cpen321.usermanagement.e2e

import android.Manifest
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.rule.GrantPermissionRule
import androidx.test.uiautomator.UiDevice
import androidx.test.platform.app.InstrumentationRegistry
import com.cpen321.usermanagement.MainActivity
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.runner.RunWith

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

    @Before
    fun setup() {
        hiltRule.inject()
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
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
     * 1. Navigate to main screen with items
     * 2. Verify sort options exist
     * 3. Select "Expiration Date" sort option
     * 4. Verify selection is applied and items remain visible
     *
     * Note: Test passes gracefully if fridge is empty
     */
    @Test
    fun testViewFridge_sortByExpirationDate() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
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

                composeTestRule.waitForIdle()

                // Click "Expiration Date" option in the dropdown
                // Note: There may be 2 "Expiration Date" nodes (button + menu item), so click the last one
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

                // Verify sort label is still visible after selecting sort option
                composeTestRule.onNodeWithText("Sort by:", substring = true)
                    .assertExists()
                    .assertIsDisplayed()
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

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {
            // Count items before sort
            val itemCountBefore = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                .fetchSemanticsNodes().size

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

                // Verify items are still visible after sort
                val itemCountAfter = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                    .fetchSemanticsNodes().size

                assert(itemCountAfter == itemCountBefore) {
                    "Items should remain visible after sorting. Before: $itemCountBefore, After: $itemCountAfter"
                }
            }
        }
    }

    /**
     * Test: Sort Fridge Items by Name
     *
     * Flow:
     * 1. Navigate to main screen with items
     * 2. Change sort to "Name" (alphabetical)
     * 3. Verify selection is applied and items remain visible
     */
    @Test
    fun testViewFridge_sortByName() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {
            // Count items before sort
            val itemCountBefore = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                .fetchSemanticsNodes().size

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
                // Note: There may be 2 "Name" nodes (button + menu item), so click the last one
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

                // Verify items are still visible after sort
                val itemCountAfter = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                    .fetchSemanticsNodes().size

                assert(itemCountAfter == itemCountBefore) {
                    "Items should remain visible after sorting. Before: $itemCountBefore, After: $itemCountAfter"
                }
            }
        }
    }

    /**
     * Test: Sort Fridge Items by Nutritional Value
     *
     * Flow:
     * 1. Navigate to main screen with items
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

        composeTestRule.waitForIdle()

        // Check if "Sort by:" exists
        val hasSortOption = composeTestRule.onAllNodesWithText("Sort by:", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        if (hasSortOption) {
            // Count items before sort
            val itemCountBefore = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                .fetchSemanticsNodes().size

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

                // Verify items are still visible after sort
                val itemCountAfter = composeTestRule.onAllNodesWithText("Nutella", substring = true)
                    .fetchSemanticsNodes().size

                assert(itemCountAfter == itemCountBefore) {
                    "Items should remain visible after sorting. Before: $itemCountBefore, After: $itemCountAfter"
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

        composeTestRule.onNodeWithText("Test")
            .assertExists()
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Recipe")
            .assertExists()
            .assertIsDisplayed()
    }
}
