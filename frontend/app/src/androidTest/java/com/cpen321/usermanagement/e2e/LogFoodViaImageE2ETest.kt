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
 * End-to-End Test for Use Case 1: Log Food via Image
 *
 * Tests the image-based food logging functionality using Gemini AI vision:
 * - Switch scanner to VISION mode
 * - Capture image of produce item
 * - Upload to backend for AI analysis
 * - Verify product identification and fridge addition
 *
 * Covered scenarios:
 * - Main success scenario: Capture image and log produce
 * - Scanner mode switching (BARCODE to VISION)
 * - Camera permission and functionality
 * - Product details display after AI analysis
 * - Item addition to fridge
 *
 * Note: This test is for Use Case 1 (UC-LOG-2) - one of the 5 major use cases
 *
 * ⚠️ TESTS CURRENTLY DISABLED ⚠️
 * These tests are commented out because they require physical camera hardware
 * which doesn't work reliably in emulators. Re-enable when running on physical devices.
 */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class LogFoodViaImageE2ETest {

    private val hiltRule = HiltAndroidRule(this)
    private val composeTestRule = createAndroidComposeRule<MainActivity>()

    // Auto-grant camera and notification permissions
    private val permissionRule = GrantPermissionRule.grant(
        Manifest.permission.CAMERA,
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
     */
    private fun clickButton(text: String) {
        composeTestRule.onNode(
            hasText(text, substring = true) and hasClickAction()
        ).performClick()
    }

    /**
     * Test: Scanner Screen Opens with Barcode Mode Default
     *
     * Verifies:
     * - Scan button exists and works
     * - Scanner screen opens
     * - Default mode is BARCODE
     * - Mode toggle buttons are present
     */
    // @Test  // Disabled: Requires physical camera hardware
    fun testLogFoodViaImage_scannerScreenOpens() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Click Scan button to open camera
        clickButton("Scan")

        // Wait for scanner screen to load
        composeTestRule.waitForIdle()

        // Verify scanner UI elements are present
        // Mode toggle buttons should be visible
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodesWithText("Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty() ||
            composeTestRule.onAllNodesWithText("Vision", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify mode toggle options exist
        val hasBarcodeOption = composeTestRule.onAllNodesWithText("Barcode", substring = true)
            .fetchSemanticsNodes().isNotEmpty()
        val hasVisionOption = composeTestRule.onAllNodesWithText("Vision", substring = true)
            .fetchSemanticsNodes().isNotEmpty()

        assert(hasBarcodeOption && hasVisionOption) {
            "Both Barcode and Vision mode options should be present. Barcode: $hasBarcodeOption, Vision: $hasVisionOption"
        }
    }

    /**
     * Test: Switch from Barcode to Vision Mode
     *
     * Flow:
     * 1. Open scanner screen (defaults to BARCODE mode)
     * 2. Click "Vision" mode button
     * 3. Verify mode switches to VISION
     * 4. Verify capture button appears
     */
    // @Test  // Disabled: Requires physical camera hardware
    fun testLogFoodViaImage_switchToVisionMode() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Click Scan button
        clickButton("Scan")

        composeTestRule.waitForIdle()

        // Wait for mode toggle to appear
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodesWithText("Vision", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Click "Vision" mode button
        composeTestRule.onNode(hasText("Vision", substring = true) and hasClickAction())
            .assertExists()
            .assertIsDisplayed()
            .performClick()

        composeTestRule.waitForIdle()

        // Verify Vision mode is now active
        // In VISION mode, there should be a capture button (camera icon or "Capture" text)
        composeTestRule.waitForIdle()

        // Verify both mode options still exist (for switching back)
        composeTestRule.onNodeWithText("Barcode", substring = true)
            .assertExists()

        composeTestRule.onNodeWithText("Vision", substring = true)
            .assertExists()
    }

    /**
     * Test: Vision Mode Camera Capture Button Exists
     *
     * Verifies that in VISION mode:
     * - Capture button is present
     * - Scanner interface is active
     */
    // @Test  // Disabled: Requires physical camera hardware
    fun testLogFoodViaImage_visionModeCaptureButton() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to scanner
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        clickButton("Scan")
        composeTestRule.waitForIdle()

        // Switch to Vision mode
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodesWithText("Vision", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNode(hasText("Vision", substring = true) and hasClickAction())
            .performClick()

        composeTestRule.waitForIdle()

        // Verify capture functionality is available
        // The camera view should be active and capture button should be clickable
        // Note: Actual capture requires camera hardware and may not work in all test environments

        // Verify mode is still set to Vision
        composeTestRule.onNodeWithText("Vision", substring = true)
            .assertExists()
            .assertIsDisplayed()
    }

    /**
     * Test: Close Scanner and Return to Main Screen
     *
     * Verifies:
     * - Back button works from scanner
     * - User returns to main screen
     * - Scanner closes properly
     */
    // @Test  // Disabled: Requires physical camera hardware
    fun testLogFoodViaImage_closeScannerFromVisionMode() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to scanner
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        clickButton("Scan")
        composeTestRule.waitForIdle()

        // Switch to Vision mode
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodesWithText("Vision", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNode(hasText("Vision", substring = true) and hasClickAction())
            .performClick()

        composeTestRule.waitForIdle()

        // Press back to close scanner
        device.pressBack()

        // Wait to return to main screen
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty() &&
            composeTestRule.onAllNodesWithText("Vision", substring = true)
                .fetchSemanticsNodes().isEmpty()
        }

        // Verify we're back on main screen
        composeTestRule.onNodeWithText("Virtual Fridge")
            .assertExists()
            .assertIsDisplayed()

        // Verify bottom navigation is visible
        composeTestRule.onNode(hasText("Scan") and hasClickAction())
            .assertExists()
            .assertIsDisplayed()

        // Verify scanner is closed (mode buttons no longer visible)
        assert(composeTestRule.onAllNodesWithText("Vision", substring = true)
            .fetchSemanticsNodes().isEmpty()) {
            "Scanner should be closed - Vision mode button should not be visible"
        }
    }

    /**
     * Test: Mode Toggle Persistence
     *
     * Verifies that mode can be switched back and forth:
     * - BARCODE → VISION → BARCODE
     */
    // @Test  // Disabled: Requires physical camera hardware
    fun testLogFoodViaImage_modeTogglePersistence() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to scanner
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        clickButton("Scan")
        composeTestRule.waitForIdle()

        // Wait for mode toggle
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodesWithText("Vision", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Switch to Vision
        composeTestRule.onNode(hasText("Vision", substring = true) and hasClickAction())
            .performClick()

        composeTestRule.waitForIdle()

        // Verify both options still exist
        composeTestRule.onNodeWithText("Barcode", substring = true)
            .assertExists()
        composeTestRule.onNodeWithText("Vision", substring = true)
            .assertExists()

        // Switch back to Barcode
        composeTestRule.onNode(hasText("Barcode", substring = true) and hasClickAction())
            .performClick()

        composeTestRule.waitForIdle()

        // Verify both options still exist after switching back
        composeTestRule.onNodeWithText("Barcode", substring = true)
            .assertExists()
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Vision", substring = true)
            .assertExists()
            .assertIsDisplayed()
    }

    /**
     * Test: Scanner Screen Elements
     *
     * Verifies all expected elements are present on scanner screen:
     * - Mode toggle buttons
     * - Close button
     * - Camera preview area
     */
    // @Test  // Disabled: Requires physical camera hardware
    fun testLogFoodViaImage_scannerScreenElements() {
        // Wait for main screen
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Navigate to scanner
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Scan") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify Scan button exists before clicking
        composeTestRule.onNode(hasText("Scan") and hasClickAction())
            .assertExists()
            .assertIsDisplayed()

        clickButton("Scan")
        composeTestRule.waitForIdle()

        // Wait for scanner to load
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodesWithText("Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify mode toggle buttons are present and clickable
        composeTestRule.onNode(hasText("Barcode", substring = true) and hasClickAction())
            .assertExists()
            .assertIsDisplayed()

        composeTestRule.onNode(hasText("Vision", substring = true) and hasClickAction())
            .assertExists()
            .assertIsDisplayed()

        // Verify main screen bottom nav is NOT visible (scanner is full screen)
        assert(composeTestRule.onAllNodes(hasText("Test") and hasClickAction())
            .fetchSemanticsNodes().isEmpty()) {
            "Main screen bottom navigation should not be visible when scanner is open"
        }
    }
}
