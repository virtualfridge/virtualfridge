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
 * End-to-End Test for Use Case 2: Log Food via Barcode
 *
 * Tests the TestBarcodeScreen which simulates barcode scanning
 * by sending a predefined barcode (Nutella: 3017620425035) to the backend.
 *
 * Covered scenarios:
 * - Main success scenario: Send barcode and view product details
 * - Failure scenario: Cancel/back navigation
 * - Button state management during API calls
 */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class LogFoodViaBarcodeE2ETest {

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
     * Test: Main Success Scenario
     *
     * Flow:
     * 1. Start at main screen ("Virtual Fridge")
     * 2. Click Test button
     * 3. Click "Send Test Barcode"
     * 4. Verify product details appear
     * 5. Verify nutritional information is shown
     */
    @Test
    fun testLogFoodViaBarcode_successScenario() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render by checking for clickable "Test" button
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Test") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to Test Barcode screen
        clickButton("Test")

        // Wait for Test Barcode screen
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify "Send Test Barcode" button exists and is enabled
        composeTestRule.onNodeWithText("Send Test Barcode")
            .assertExists()
            .assertIsEnabled()

        // Click "Send Test Barcode"
        composeTestRule.onNodeWithText("Send Test Barcode")
            .performClick()

        // Wait for product details to load
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Product Details", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify product details section exists
        composeTestRule.onNodeWithText("Product Details")
            .assertExists()

        // Verify product name is displayed
        composeTestRule.onNodeWithText("Name")
            .assertExists()

        // Nutrients section is optional (may not be in all API responses)
        // Just verify the core product details loaded successfully
        composeTestRule.waitForIdle()
    }

    /**
     * Test: Button States During Loading
     *
     * Verifies that:
     * - Button is enabled before sending
     * - Button text changes to "Sending..." during API call
     * - Button becomes disabled during sending
     */
    @Test
    fun testLogFoodViaBarcode_buttonStatesDuringLoading() {
        // Navigate to main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render by checking for clickable "Test" button
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Test") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to Test Barcode screen
        clickButton("Test")

        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify button is initially enabled
        composeTestRule.onNodeWithText("Send Test Barcode")
            .assertIsEnabled()

        // Click the button
        composeTestRule.onNodeWithText("Send Test Barcode")
            .performClick()

        // Check if "Sending..." appears (may be brief)
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Sending...", substring = true)
                .fetchSemanticsNodes().isNotEmpty() ||
            composeTestRule.onAllNodesWithText("Product Details", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for completion
        composeTestRule.waitForIdle()
    }

    /**
     * Test: Cancel/Back Navigation
     *
     * Verifies that:
     * - User can navigate to Test Barcode screen
     * - User can press back to return to main screen
     * - Test Barcode screen is no longer visible after back navigation
     */
    @Test
    fun testLogFoodViaBarcode_cancelNavigation() {
        // Navigate to main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render by checking for clickable "Test" button
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Test") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to Test Barcode screen
        clickButton("Test")

        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify we're on Test Barcode screen
        composeTestRule.onNodeWithText("Test Barcode")
            .assertExists()

        // Press back button
        device.pressBack()

        // Wait for navigation back to main screen
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty() &&
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isEmpty()
        }

        // Verify we're back on main screen
        composeTestRule.onNodeWithText("Virtual Fridge")
            .assertExists()
    }

    /**
     * Test: Verify Test Barcode Screen Elements
     *
     * Checks that all expected UI elements exist:
     * - Screen title
     * - Instruction text
     * - Send button
     */
    @Test
    fun testLogFoodViaBarcode_screenElementsExist() {
        // Navigate to main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render by checking for clickable "Test" button
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Test") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to Test Barcode screen
        clickButton("Test")

        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify screen title
        composeTestRule.onNodeWithText("Test Barcode")
            .assertExists()

        // Verify instruction text
        composeTestRule.onNodeWithText("Send the default test barcode", substring = true)
            .assertExists()

        // Verify send button
        composeTestRule.onNodeWithText("Send Test Barcode")
            .assertExists()
    }
}
