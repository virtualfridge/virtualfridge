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
 * Simplified End-to-End Tests
 *
 * These tests follow the actual app flow:
 * 1. App starts → LOADING screen
 * 2. → AUTH screen (auto-authenticates in test)
 * 3. → MAIN screen ("Virtual Fridge")
 * 4. From MAIN, can navigate to other screens
 */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class SimpleE2ETest {

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
     * Test 1: App Launches and Reaches Main Screen
     *
     * Verifies the app starts correctly and navigates through:
     * LOADING → AUTH → MAIN ("Virtual Fridge")
     */
    @Test
    fun test01_appLaunchesSuccessfully() {
        // Wait for main screen to load (app title is "Virtual Fridge")
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Wait for bottom bar to fully render by checking for clickable "Test" button
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Test") and hasClickAction())
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify we're on the main screen (title should exist)
        composeTestRule.onAllNodesWithText("Virtual Fridge", substring = true)[0]
            .assertExists()
    }

    /**
     * Test 2: Navigate to Test Barcode Screen
     *
     * From MAIN screen:
     * 1. Click "Test" button
     * 2. Verify "Test Barcode" screen loads
     */
    @Test
    fun test02_navigateToTestBarcodeScreen() {
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

        // Click the Test button (🧪 Test)
        clickButton("Test")

        // Wait for Test Barcode screen
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify Test Barcode screen is displayed
        composeTestRule.onNodeWithText("Test Barcode")
            .assertExists()
    }

    /**
     * Test 3: Send Test Barcode and Verify Response
     *
     * 1. Navigate to Test Barcode screen
     * 2. Click "Send Test Barcode" button
     * 3. Verify product details appear
     */
    @Test
    fun test03_sendTestBarcode() {
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

        // Click Test button
        clickButton("Test")

        // Wait for Test Barcode screen
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Click "Send Test Barcode" button
        composeTestRule.onNodeWithText("Send Test Barcode")
            .assertExists()
            .performClick()

        // Wait for product details to appear
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Product Details", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify product details section exists
        composeTestRule.onNodeWithText("Product Details")
            .assertExists()

        // Verify some product information is displayed
        composeTestRule.onNodeWithText("Name")
            .assertExists()
    }

    /**
     * Test 4: Verify Main Screen Buttons Exist
     *
     * Checks that all bottom bar buttons are present:
     * - Scan
     * - Test
     * - Recipe
     * - Notify
     */
    @Test
    fun test04_mainScreenButtonsExist() {
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

        // Verify all bottom bar buttons exist
        composeTestRule.onNodeWithText("Scan")
            .assertExists()

        composeTestRule.onNodeWithText("Test")
            .assertExists()

        composeTestRule.onNodeWithText("Recipe")
            .assertExists()

        composeTestRule.onNodeWithText("Notify")
            .assertExists()
    }

    /**
     * Test 5: Back Navigation from Test Barcode Screen
     *
     * 1. Navigate to Test Barcode screen
     * 2. Press back button
     * 3. Verify return to main screen
     */
    @Test
    fun test05_backNavigationFromTestBarcode() {
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

        // Click Test button
        clickButton("Test")

        // Wait for Test Barcode screen
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodesWithText("Test Barcode", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Press back
        device.pressBack()

        // Wait to return to main screen
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
}
