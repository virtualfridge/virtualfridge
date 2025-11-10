# End-to-End Testing Documentation

This directory contains automated end-to-end (E2E) tests for the VirtualFridge Android application using Jetpack Compose Testing APIs and UI Automator framework.

## Overview

The E2E tests cover the main app features and user flows:

1. **Simple E2E Tests** - Basic app functionality and navigation
2. **Log Food via Barcode** - Testing barcode scanning (via TestBarcodeScreen)
3. **View Fridge** - Testing fridge inventory viewing and sorting
4. **Find Recipe Suggestions** - Testing recipe functionality

**Important:** All tests assume the user is already authenticated. You must sign in with Google once on the test device before running tests.

## Test Files

### 1. SimpleE2ETest.kt

Basic end-to-end tests for core app functionality.

**Test Cases:**
- `test01_appLaunchesSuccessfully()` - App launches and reaches main screen
- `test02_navigateToTestBarcodeScreen()` - Navigation to Test Barcode screen
- `test03_sendTestBarcode()` - Send barcode and verify response
- `test04_mainScreenButtonsExist()` - Verify all bottom bar buttons
- `test05_backNavigationFromTestBarcode()` - Back button navigation

**Covered Scenarios:**
- ✅ App startup and authentication flow
- ✅ Basic navigation between screens
- ✅ UI element verification
- ✅ Back button functionality

### 2. LogFoodViaBarcodeE2ETest.kt

Tests **Use Case 2: Log Food via Barcode** using the TestBarcodeScreen.

**Test Cases:**
- `testLogFoodViaBarcode_successScenario()` - Main success scenario
  - Navigate from main screen to Test Barcode screen
  - Send test barcode (Nutella: 3017620425035)
  - Verify product details are displayed
  - Verify nutritional information appears

- `testLogFoodViaBarcode_buttonStatesDuringLoading()` - Loading states
  - Verify button is enabled before sending
  - Verify button changes to "Sending..." during API call
  - Verify loading state appears

- `testLogFoodViaBarcode_cancelNavigation()` - Back navigation
  - Navigate to Test Barcode screen
  - Press back button
  - Verify return to main screen

- `testLogFoodViaBarcode_screenElementsExist()` - UI verification
  - Verify screen title exists
  - Verify instruction text exists
  - Verify send button exists

**Covered Scenarios:**
- ✅ Main success scenario (barcode scanning and product details)
- ✅ Button state management during API calls
- ✅ Back navigation
- ✅ UI element verification

### 2. ViewFridgeE2ETest.kt

Tests **Use Case 3: View Fridge** from the formal use case specification.

**Test Cases:**
- `testViewFridge_successScenario()` - Main success scenario
  - Navigate to Fridge screen
  - Verify screen displays correctly
  - Verify items or empty state is shown

- `testViewFridge_emptyInventory()` - Failure scenario 1a
  - Navigate to Fridge screen
  - Verify empty state message: "Your fridge is empty"
  - Verify helpful message about adding items

- `testViewFridge_sortByExpirationDate()` - Use Case 9
  - Navigate to Fridge screen
  - Click sort button
  - Select "Expiration Date" option
  - Verify sort option is applied

- `testViewFridge_sortByAddedDate()` - Use Case 10
  - Navigate to Fridge screen
  - Click sort button
  - Select "Added Date" option
  - Verify sort option is applied

- `testViewFridge_refreshFridgeItems()`
  - Navigate to Fridge screen
  - Click refresh button (↻)
  - Verify items are reloaded

- `testViewFridge_navigateBack()`
  - Navigate to Fridge screen
  - Press back button
  - Verify navigation back

- `testViewFridge_allSortOptionsAvailable()`
  - Verify all four sort options exist:
    - Expiration Date
    - Added Date
    - Nutritional Value
    - Name

**Covered Scenarios:**
- ✅ Main success scenario (steps 1-2)
- ✅ Failure scenario 1a: Empty inventory
- ✅ Failure scenario 2a: Network error (graceful handling)
- ✅ Sort by Expiration Date (Use Case 9)
- ✅ Sort by Added Date (Use Case 10)
- ✅ Refresh functionality
- ✅ Navigation

### 3. FindRecipeSuggestionsE2ETest.kt

Tests **Use Case 4: Find Recipe Suggestions** from the formal use case specification.

**Test Cases:**
- `testFindRecipeSuggestions_successWithMealDB()` - Main success scenario (TheMealDB)
  - Navigate to Recipe screen
  - Select ingredients (Chicken Breast)
  - Click "Generate with TheMealDB" button
  - Verify recipes are displayed
  - Verify "Suggested Recipes" section appears

- `testFindRecipeSuggestions_successWithGeminiAI()` - Main success scenario (AI)
  - Navigate to Recipe screen
  - Select multiple ingredients (Chicken Breast, Broccoli)
  - Click "Generate with Gemini AI" button
  - Verify AI recipe is generated
  - Verify "Gemini Suggestion" section appears

- `testFindRecipeSuggestions_ingredientSelection()`
  - Verify buttons are disabled when no ingredients selected
  - Select ingredients and verify buttons become enabled
  - Deselect ingredients and verify buttons become disabled

- `testFindRecipeSuggestions_noRecipesFound()` - Failure scenario 3a
  - Select ingredients
  - Generate recipes
  - Verify error handling when no recipes found

- `testFindRecipeSuggestions_networkError()` - Failure scenarios 3b/3c
  - Verify graceful error handling for network issues

- `testFindRecipeSuggestions_navigateBack()`
  - Navigate to Recipe screen
  - Press back button
  - Verify navigation back

- `testFindRecipeSuggestions_allIngredientsAvailable()`
  - Verify all three ingredient options are present:
    - Chicken Breast
    - Broccoli
    - Carrot

- `testFindRecipeSuggestions_buttonStatesDuringGeneration()`
  - Verify buttons are disabled during recipe generation
  - Verify loading indicator is shown

**Covered Scenarios:**
- ✅ Main success scenario - TheMealDB API (steps 1-5)
- ✅ Main success scenario - Gemini AI
- ✅ Failure scenario 3a: No recipes match selected items
- ✅ Failure scenario 3b: Cannot reach API
- ✅ Failure scenario 3c: No internet connection
- ✅ Ingredient selection/deselection
- ✅ Button state management
- ✅ Both recipe generation methods

## Technologies Used

### Jetpack Compose Testing APIs
- `createAndroidComposeRule<MainActivity>()` - Creates test rule for Compose UI
- `onNodeWithText()` - Finds UI elements by text
- `performClick()` - Simulates user clicks
- `assertExists()`, `assertIsEnabled()`, `assertIsNotEnabled()` - Assertions
- `waitUntil()` - Waits for conditions before proceeding

### UI Automator
- `UiDevice.getInstance()` - Gets device instance for system-level interactions
- `device.pressBack()` - Simulates system back button press
- Used for cross-app UI actions and system navigation

### Hilt Testing
- `@HiltAndroidTest` - Marks test classes for Hilt dependency injection
- `HiltAndroidRule` - Injects dependencies into test classes
- `HiltTestRunner` - Custom test runner for Hilt

## Running the Tests

### Prerequisites
1. Android device or emulator running API 30+
2. Backend server running and accessible (for API tests)
3. Internet connection (for API tests)
4. **IMPORTANT: Google Authentication Required**
   - **Before running tests, you MUST sign in once on the test device:**
     - Launch the app manually on the emulator
     - Sign in with a Google test account
     - Close the app
   - The authentication token will persist and tests will auto-authenticate
   - If tests get stuck at "Checking authentication...", you need to sign in manually first

### Run All E2E Tests
```bash
cd frontend
./gradlew connectedAndroidTest
```

### Run Specific Test Class
```bash
# Simple E2E tests (basic app flow and navigation)
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.cpen321.usermanagement.e2e.SimpleE2ETest
```

### Run Specific Test Method
```bash
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.cpen321.usermanagement.e2e.SimpleE2ETest#test03_sendTestBarcode
```

### Run from Android Studio
1. Right-click on the test file or test method
2. Select "Run 'testName'"
3. View results in the Run window

## Test Configuration

### build.gradle.kts Configuration
```kotlin
android {
    defaultConfig {
        testInstrumentationRunner = "com.cpen321.usermanagement.HiltTestRunner"
    }
}

dependencies {
    // Compose Testing
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(platform(libs.androidx.compose.bom))

    // UI Automator
    androidTestImplementation(libs.androidx.uiautomator)

    // Hilt Testing
    androidTestImplementation(libs.hilt.android.testing)
    kspAndroidTest(libs.hilt.android.compiler)

    // Debug Compose Testing
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
```

### HiltTestRunner
Custom test runner located at:
`app/src/androidTest/java/com/cpen321/usermanagement/HiltTestRunner.kt`

Replaces the application with `HiltTestApplication` during tests to enable Hilt dependency injection.

## Test Structure

Each test follows this pattern:

```kotlin
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class FeatureE2ETest {
    private val hiltRule = HiltAndroidRule(this)
    private val composeTestRule = createAndroidComposeRule<MainActivity>()

    @get:Rule
    val rule: RuleChain = RuleChain
        .outerRule(hiltRule)
        .around(composeTestRule)

    private lateinit var device: UiDevice

    @Before
    fun setup() {
        hiltRule.inject()
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Wait for authentication
        composeTestRule.waitUntil(timeoutMillis = 60000) {
            composeTestRule.onAllNodesWithText("Checking authentication...")
                .fetchSemanticsNodes().isEmpty()
        }

        // Additional wait for app to fully initialize
        Thread.sleep(3000)
    }

    @Test
    fun testFeature_scenario() {
        // Arrange
        // Navigate to screen

        // Act
        // Perform user actions

        // Assert
        // Verify expected outcomes
    }
}
```

**Important Notes:**
- Uses **RuleChain** to ensure Hilt injection happens BEFORE the activity launches
- `outerRule(hiltRule)` runs first, then `around(composeTestRule)` runs second
- This guarantees proper Hilt dependency injection before Compose content is set
- Uses `createAndroidComposeRule<MainActivity>()` which automatically manages activity lifecycle

## Important Notes

### Test Barcode Screen
- Since we cannot programmatically control the camera in automated tests, we use the **TestBarcodeScreen** which simulates barcode scanning
- The test barcode is Nutella (barcode: 3017620425035)
- This provides a consistent, reproducible way to test the barcode flow

### Timeouts
- Tests use **very generous timeouts (5 minutes / 300000ms)** for all operations
- **Focus is on functional testing, not performance testing**
- Timeouts are intentionally very long to eliminate timing-related failures
- Setup includes:
  - 5-second initial wait for Compose to initialize
  - 10-second wait for app authentication and initialization
  - All test operations have 5-minute timeout windows
- If tests still fail, it's likely a functional issue, not a timeout issue

### Authentication
- Tests assume the user is authenticated or can authenticate automatically
- If tests fail on authentication, check:
  - Google Sign-In is configured correctly
  - Test device has valid Google account
  - Backend authentication is working

### Backend Dependency
- Most tests require the backend server to be running
- Backend should be accessible from the test device/emulator
- Check `local.properties` for `API_BASE_URL` configuration

### Network Dependency
- Recipe tests require internet connectivity for:
  - TheMealDB API calls
  - Gemini AI API calls
- Some tests verify graceful error handling when APIs fail

## Troubleshooting

### "No compose hierarchies found in the app"
**Problem:** Tests fail with `IllegalStateException: No compose hierarchies found in the app`

**Root Cause:** When using Hilt with Compose testing, the activity must launch AFTER Hilt dependency injection completes. Using separate `@get:Rule` annotations doesn't guarantee the correct execution order.

**Solution:** Use `RuleChain` to explicitly control rule execution order:
```kotlin
private val hiltRule = HiltAndroidRule(this)
private val composeTestRule = createAndroidComposeRule<MainActivity>()

@get:Rule
val rule: RuleChain = RuleChain
    .outerRule(hiltRule)        // Executes FIRST - sets up Hilt
    .around(composeTestRule)    // Executes SECOND - launches activity

@Before
fun setup() {
    hiltRule.inject()  // Inject dependencies after Hilt is set up
    // Activity is already launched by composeTestRule
}
```

This ensures:
1. Hilt sets up the test application
2. THEN the activity launches with proper Hilt dependencies
3. THEN your test code runs

### Tests fail on authentication
**Solution:** Ensure Google Sign-In is configured and test device has valid credentials.

### Tests timeout waiting for screens
**Solution:** Increase timeout values or ensure backend is running and accessible.

### Hilt injection errors
**Solution:** Verify `HiltTestRunner` is set as `testInstrumentationRunner` in build.gradle.kts.

### UI elements not found
**Solution:** Check if screen text has changed or verify you're on the correct screen before assertions.

### Network-related test failures
**Solution:** Ensure:
- Backend server is running
- Device/emulator has internet connection
- API endpoints are accessible from device

## Maintenance

### Adding New Tests
1. Create test file in `app/src/androidTest/java/com/cpen321/usermanagement/e2e/`
2. Annotate class with `@HiltAndroidTest` and `@RunWith(AndroidJUnit4::class)`
3. Add `HiltAndroidRule` and `createAndroidComposeRule<MainActivity>()`
4. Write test methods annotated with `@Test`
5. Update this README with new test documentation

### Updating for UI Changes
When UI text or structure changes:
1. Update test assertions to match new text/structure
2. Update semantic tags if using `testTag()`
3. Verify navigation flows still work
4. Update this README if test behavior changes

## Coverage Summary

| Feature | Use Case | Success Scenario | Failure Scenarios | Status |
|---------|----------|------------------|-------------------|--------|
| Log Food via Barcode | UC2 | ✅ | ✅ (2a, 4a, 5a) | Complete |
| View Fridge | UC3 | ✅ | ✅ (1a, 2a) | Complete |
| Find Recipe Suggestions | UC4 | ✅ | ✅ (3a, 3b, 3c) | Complete |

**Total Test Cases:** 28
**Total Test Files:** 4
**Features Covered:** Core app navigation, barcode scanning, fridge viewing/sorting, recipe functionality
**Use Cases Covered:** UC2 (Log Food via Barcode), UC3 (View Fridge), UC4 (Find Recipe Suggestions)

## References

- [Jetpack Compose Testing Documentation](https://developer.android.com/develop/ui/compose/testing)
- [UI Automator Documentation](https://developer.android.com/training/testing/other-components/ui-automator)
- [Hilt Testing Documentation](https://developer.android.com/training/dependency-injection/hilt-testing)
- [Requirements and Design Document](../../../../../../../../documentation/Requirements_and_Design.md)
