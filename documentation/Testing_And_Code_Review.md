# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them

#### 2.1.1. Tests

| **Interface**                        | **Describe Group Location, No Mocks**                                          | **Describe Group Location, With Mocks**                                          | **Mocked Components**                    |
| ------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------- |
| **POST /api/auth/google**            | N/A                                                                            | [`backend/src/__tests__/controllers/auth.test.ts#L38`](../backend/src/__tests__/controllers/auth.test.ts#L38) | Google OAuth2Client                      |
| **POST /api/auth/signup**            | N/A                                                                            | [`backend/src/__tests__/controllers/auth.test.ts#L135`](../backend/src/__tests__/controllers/auth.test.ts#L135) | Google OAuth2Client                      |
| **POST /api/auth/signin**            | N/A                                                                            | [`backend/src/__tests__/controllers/auth.test.ts#L238`](../backend/src/__tests__/controllers/auth.test.ts#L238) | Google OAuth2Client                      |
| **GET /api/user/profile**            | N/A                                                                            | [`backend/src/__tests__/controllers/user.test.ts#L43`](../backend/src/__tests__/controllers/user.test.ts#L43) | Google OAuth2Client                      |
| **POST /api/user/profile**           | N/A                                                                            | [`backend/src/__tests__/controllers/user.test.ts#L72`](../backend/src/__tests__/controllers/user.test.ts#L72) | Google OAuth2Client                      |
| **DELETE /api/user/profile**         | N/A                                                                            | [`backend/src/__tests__/controllers/user.test.ts#L152`](../backend/src/__tests__/controllers/user.test.ts#L152) | Google OAuth2Client                      |
| **POST /api/food-item**              | [`backend/src/__tests__/controllers/foodItem.test.ts#L40`](../backend/src/__tests__/controllers/foodItem.test.ts#L40) | N/A                                                                              | None                                     |
| **PUT /api/food-item**               | [`backend/src/__tests__/controllers/foodItem.test.ts#L101`](../backend/src/__tests__/controllers/foodItem.test.ts#L101) | N/A                                                                              | None                                     |
| **GET /api/food-item/:_id**          | [`backend/src/__tests__/controllers/foodItem.test.ts#L177`](../backend/src/__tests__/controllers/foodItem.test.ts#L177) | N/A                                                                              | None                                     |
| **DELETE /api/food-item/:_id**       | [`backend/src/__tests__/controllers/foodItem.test.ts#L235`](../backend/src/__tests__/controllers/foodItem.test.ts#L235) | N/A                                                                              | None                                     |
| **POST /api/food-type**              | [`backend/src/__tests__/controllers/foodType.test.ts#L36`](../backend/src/__tests__/controllers/foodType.test.ts#L36) | N/A                                                                              | None                                     |
| **GET /api/food-type/:id**           | [`backend/src/__tests__/controllers/foodType.test.ts#L89`](../backend/src/__tests__/controllers/foodType.test.ts#L89) | N/A                                                                              | None                                     |
| **GET /api/food-type/barcode/:id**   | [`backend/src/__tests__/controllers/foodType.test.ts#L133`](../backend/src/__tests__/controllers/foodType.test.ts#L133) | N/A                                                                              | None                                     |
| **PATCH /api/food-type/:id**         | [`backend/src/__tests__/controllers/foodType.test.ts#L175`](../backend/src/__tests__/controllers/foodType.test.ts#L175) | N/A                                                                              | None                                     |
| **DELETE /api/food-type/:id**        | [`backend/src/__tests__/controllers/foodType.test.ts#L236`](../backend/src/__tests__/controllers/foodType.test.ts#L236) | N/A                                                                              | None                                     |
| **GET /api/hobbies**                 | [`backend/src/__tests__/controllers/hobby.test.ts#L26`](../backend/src/__tests__/controllers/hobby.test.ts#L26) | N/A                                                                              | None                                     |
| **POST /api/notifications/test**     | N/A                                                                            | [`backend/src/__tests__/controllers/notification.test.ts#L58`](../backend/src/__tests__/controllers/notification.test.ts#L58) | Firebase Admin SDK                       |
| **POST /api/media/upload**           | N/A                                                                            | [`backend/src/__tests__/controllers/media.test.ts#L55`](../backend/src/__tests__/controllers/media.test.ts#L55) | File system (multer), Storage service    |
| **POST /api/media/analyze-produce**  | N/A                                                                            | [`backend/src/__tests__/controllers/media.test.ts#L160`](../backend/src/__tests__/controllers/media.test.ts#L160) | Gemini AI Vision API                     |
| **GET /api/recipes**                 | N/A                                                                            | [`backend/src/__tests__/controllers/recipe.test.ts#L34`](../backend/src/__tests__/controllers/recipe.test.ts#L34) | Gemini AI API                            |
| **POST /api/recipes/ai**             | N/A                                                                            | [`backend/src/__tests__/controllers/recipe.test.ts#L111`](../backend/src/__tests__/controllers/recipe.test.ts#L111) | Gemini AI API                            |

#### 2.1.2. Commit Hash Where Tests Run

`65ed7f775bd9e57ad305cfe426c20ae9ea81bfb8`

#### 2.1.3. Explanation on How to Run the Tests

1. **Clone the Repository**:

   - Open your terminal and run:
     ```bash
     git clone https://github.com/virtualfridge/virtualfridge.git
     cd virtualfridge/backend
     ```

2. **Install Dependencies**:

   - Run the following command to install all required packages:
     ```bash
     npm install
     ```

3. **Set Up Environment Variables**:

   - Create a `.env` file in the `backend` directory with the required environment variables:
     ```
     PORT=3000
     JWT_SECRET=your-jwt-secret
     GOOGLE_CLIENT_ID=your-google-client-id
     MONGODB_URI=your-mongodb-uri
     MONGODB_USER=your-mongodb-user
     MONGODB_PASS=your-mongodb-password
     GEMINI_API_KEY=your-gemini-api-key
     FIREBASE_SERVICE_ACCOUNT=your-firebase-service-account-json
     ```
   - **Note**: Tests use an in-memory MongoDB database, so MongoDB connection variables are not required for testing.

4. **Run All Tests**:

   - To run all tests (both mocked and unmocked):
     ```bash
     npm test
     ```

5. **Run Only Mocked Tests**:

   - To run only tests that use mocks (tests with external API/service mocking):
     ```bash
     npm run test:mocked
     ```

6. **Run Only Unmocked Tests**:

   - To run only tests without mocks (pure integration tests):
     ```bash
     npm run test:unmocked
     ```

7. **Run Tests with Coverage**:

   - To run all tests with coverage report:
     ```bash
     npm run test:coverage
     ```
   - For mocked tests only:
     ```bash
     npm run test:coverage:mocked
     ```
   - For unmocked tests only:
     ```bash
     npm run test:coverage:unmocked
     ```

8. **Run Tests in Watch Mode**:

   - To run tests in watch mode (automatically re-runs on file changes):
     ```bash
     npm run test:watch
     ```
   - For mocked tests in watch mode:
     ```bash
     npm run test:watch:mocked
     ```
   - For unmocked tests in watch mode:
     ```bash
     npm run test:watch:unmocked
     ```

9. **View Test Results**:
   - Test results will be displayed in the terminal
   - Coverage reports are generated in the `backend/coverage` directory
   - Mocked test coverage: `backend/coverage/mocked`
   - Unmocked test coverage: `backend/coverage/unmocked`

### 2.2. GitHub Actions Configuration Location

`~/.github/workflows/backend-tests.yml`

### 2.3. Jest Coverage Report Screenshots for Tests Without Mocking

![](images/unmocked_1.png)
![](images/unmocked_2.png)

### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

![](images/mocked_1.png)
![](images/mocked_2.png)

### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

![](images/both_test_1.png)
![](images/both_test_2.png)

---

## 3. Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Time to Full Display (TTFD) Benchmark**          | [`frontend/macrobenchmark/src/main/java/com/example/macrobenchmark/TtfdStartupBenchmark.kt`](../frontend/macrobenchmark/src/main/java/com/example/macrobenchmark/TtfdStartupBenchmark.kt) |
| **Barcode Lookup Benchmark** | [`frontend/macrobenchmark/src/main/java/com/example/macrobenchmark/BarcodeLookupBenchmark.kt`](../frontend/macrobenchmark/src/main/java/com/example/macrobenchmark/BarcodeLookupBenchmark.kt) |

### 3.2. Test Verification and Logs

- **Time to Full Display (TTFD) Benchmark**

  - **Verification:** This test simulates a user starting the app multiple times from a cold boot state. The test launches and quits the app repeatedly over 10 iterations, where the minimum, median, and max time is calculated between the startup intent to the time to fully display the app.
  - **Log Output**
  Below is what the expected output should be, where you can see the minimum, median, and max loading time from the iterations in milliseconds.
  
![](images/TTFDTest.png)

- **Barcode Lookup Benchmark**
  - **Verification:** This test simulates a user logging into the app and sending a barcode API request. It is done over 10 iterations, where the minimum, median, and max time are displayed in milliseconds. The minimum, median, and max time is calculated between the moment the test barcode button is clicked to the time to receive the API call back.
  - **Log Output**
Below is what the expected output should be, where you can see the minimum, median, and max loading time from the iterations in milliseconds.

![](images/barcodeTest.png)

- **Running the Tests:** To runs the tests, open the `frontend` folder as a project in Android Studio. Running the app normally and ensure that only one Google account is logged into the phone. Then select the appropriate test (see screenshot below).

![](images/topNonFunc.png)

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite:

`frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/`

### 4.2. Tests

- **Use Case: Log Food via Barcode**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user chooses the barcode scan option from "Add Food."<br>2. The app opens the scanner interface.<br>3–5. The barcode is captured, decoded, and product data is pulled from Open Food Facts.<br>6–9. The confirmation UI appears, the user confirms, the item is added, and the fridge refreshes. | `LogFoodViaBarcodeE2ETest#testLogFoodViaBarcode_successScenario` sends a test barcode (Nutella: 3017620425035) to the backend via `MainViewModel.testSendBarcode()`, waits for the API response, verifies the response contains product data with "Nutella" in the name, and confirms the item appears in the fridge list.<br>`LogFoodViaBarcodeE2ETest#testLogFoodViaBarcode_stateManagementDuringLoading` verifies that `isSendingTestBarcode` is true during the API call and `testBarcodeResponse` is populated after completion.<br>`LogFoodViaBarcodeE2ETest#testLogFoodViaBarcode_itemPersistsInFridge` confirms that the added item remains in the fridge even after clearing the test barcode state, verifying proper data persistence. |
    | State management and cleanup | `LogFoodViaBarcodeE2ETest#testLogFoodViaBarcode_clearStateAfterSend` sends a test barcode, waits for the response, then clears the state using `clearTestBarcodeState()` and verifies all test barcode related fields are properly reset (testBarcodeResponse, isSendingTestBarcode, scanError all null/false). |
    | 4a. Barcode unreadable/damaged → prompt to re-scan. | Not yet automated (requires scanner error injection). |
    | 5a. Product not found → notify user and offer alternate methods. | Not yet automated (requires backend error mock). |

  - **Test Logs:**
    ```
    Finished 25 tests on Pixel_7(AVD) - 13
    [XmlResultReporter]: XML test result file generated at /Users/danielding/Desktop/CPEN321/virtualfridge/frontend/app/build/outputs/androidTest-results/connected/debug/TEST-Pixel_7(AVD) - 13-_app-.xml. Total tests 25, passed 25,
    信息: Execute com.cpen321.usermanagement.e2e.LogFoodViaBarcodeE2ETest.testLogFoodViaBarcode_successScenario: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.LogFoodViaBarcodeE2ETest.testLogFoodViaBarcode_stateManagementDuringLoading: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.LogFoodViaBarcodeE2ETest.testLogFoodViaBarcode_clearStateAfterSend: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.LogFoodViaBarcodeE2ETest.testLogFoodViaBarcode_itemPersistsInFridge: PASSED
    ```

- **Use Case: View Fridge**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user navigates to the home page (Virtual Fridge).<br>2. The system shows the fridge inventory. | `ViewFridgeE2ETest#testViewFridge_mainScreenSuccess` waits for the "Virtual Fridge" screen to load and verifies either the fridge items are displayed or the empty state message is shown. It also confirms the "Scan" button exists in the bottom navigation bar. |
    | 1a. Inventory is empty → show empty state message. | `ViewFridgeE2ETest#testViewFridge_emptyState` checks for the empty-state message ("Your Virtual Fridge is waiting to be filled!") and helpful instructions about using the "Scan button". It also verifies that sort options are NOT shown when the fridge is empty. |
    | 2a. A network error prevents loading → show error message. | Not yet automated (requires forcing `FridgeViewModel` into its error branch). |

  - **Supplementary Sorting & UI Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | Sort fridge items by Expiration Date (earliest to latest). | `ViewFridgeE2ETest#testViewFridge_sortByExpirationDate` adds two test items (Nutella and Prince), opens the sort dropdown, selects "Expiration Date", and verifies that items are sorted chronologically by parsing and comparing expiration dates from the UI. |
    | Sort fridge items by Added Date. | `ViewFridgeE2ETest#testViewFridge_sortByAddedDate` adds two test items, opens the sort dropdown, selects "Added Date", and verifies that both test items remain visible at different positions in the sorted list. |
    | Sort fridge items by Name (alphabetical). | `ViewFridgeE2ETest#testViewFridge_sortByName` adds two test items, opens the sort dropdown, selects "Name", and verifies that product names are displayed in alphabetical order by comparing text content. |
    | Sort fridge items by Nutritional Value (calories, descending). | `ViewFridgeE2ETest#testViewFridge_sortByNutritionalValue` adds two test items, opens the sort dropdown, selects "Nutritional Value", then opens nutrition dialogs to extract calorie values and verifies items are sorted from highest to lowest calories. |
    | Bottom navigation buttons are visible and functional. | `ViewFridgeE2ETest#testViewFridge_bottomBarButtons` waits for the bottom bar to fully render and asserts that core buttons (Scan, Recipe) exist and are displayed. |

  - **Test Logs:**
    ```
    Finished 25 tests on Pixel_7(AVD) - 13
    [XmlResultReporter]: XML test result file generated at /Users/danielding/Desktop/CPEN321/virtualfridge/frontend/app/build/outputs/androidTest-results/connected/debug/TEST-Pixel_7(AVD) - 13-_app-.xml. Total tests 25, passed 25,
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_mainScreenSuccess: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_sortByExpirationDate: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_sortByAddedDate: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_sortByName: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_sortByNutritionalValue: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_emptyState: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewFridgeE2ETest.testViewFridge_bottomBarButtons: PASSED
    ```

- **Use Case: Find Recipe Suggestions**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. User selects ingredient(s) from the fridge inventory.<br>2. User taps the Recipe button. | `FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_recipeButtonDisabledWithoutSelection` waits for the main screen, verifies the Recipe button exists, clicks it without selecting items, and confirms the recipe options sheet does NOT open when no items are selected.<br>`FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_recipeOptionsSheetOpens` adds a Nutella test item using `addTestItemToFridge()`, clicks the item to select it, taps the Recipe button, and verifies the "Choose Your Recipe Style" bottom sheet appears with both "Recipe Database" and "AI Chef" options that are clickable. |
    | 3–5. The system requests recipes via TheMealDB and shows results (or a "No Recipes Found" fallback). | `FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_mealDBGeneration` adds a test item, selects it by clicking on the percentage "remaining" text, taps Recipe button, clicks "Recipe Database" option, waits for either "Fetching recipes from MealDB…" (loading state), "Recipes from MealDB" (success), or "No recipes found" (no results), and verifies that one of these states is displayed. |
    | 6. User opens a recipe link. | Not yet automated (current tests only verify the recipe cards render; they don't tap through to external content). |
    | Failure 3a. No recipes match → notify user. | Covered by `FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_mealDBGeneration` when the UI shows the "No recipes found" message. |
    | Failure 3b/3c. API unreachable or no internet → show error messages. | Not yet automated (requires API/network fault injection). |
    | Gemini AI alternative success path. | `FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_aiGeneration` adds a test item, selects it, taps Recipe, clicks "AI Chef" option, waits for "Generating AI recipe with Gemini…" (loading state), then verifies either "AI Chef Recipe" content, "No Recipes Found", or "Error" message is displayed. |
    | Recipe sheet can be dismissed without side effects. | `FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_dismissRecipeSheet` adds a test item, selects it, opens the recipe options sheet, presses the back button using `device.pressBack()`, and confirms the sheet text disappears while "Virtual Fridge" remains visible. |
    | Bottom navigation buttons are accessible. | `FindRecipeSuggestionsE2ETest#testFindRecipeSuggestions_bottomBarButtonsExist` waits for the bottom bar to fully render and verifies that Scan and Recipe buttons exist and are displayed. |

  - **Test Logs:**
    ```
    Finished 25 tests on Pixel_7(AVD) - 13
    [XmlResultReporter]: XML test result file generated at /Users/danielding/Desktop/CPEN321/virtualfridge/frontend/app/build/outputs/androidTest-results/connected/debug/TEST-Pixel_7(AVD) - 13-_app-.xml. Total tests 25, passed 25,
    信息: Execute com.cpen321.usermanagement.e2e.FindRecipeSuggestionsE2ETest.testFindRecipeSuggestions_recipeButtonDisabledWithoutSelection: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.FindRecipeSuggestionsE2ETest.testFindRecipeSuggestions_recipeOptionsSheetOpens: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.FindRecipeSuggestionsE2ETest.testFindRecipeSuggestions_mealDBGeneration: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.FindRecipeSuggestionsE2ETest.testFindRecipeSuggestions_aiGeneration: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.FindRecipeSuggestionsE2ETest.testFindRecipeSuggestions_dismissRecipeSheet: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.FindRecipeSuggestionsE2ETest.testFindRecipeSuggestions_bottomBarButtonsExist: PASSED
    ```

- **Use Case: View Nutritional Facts**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. User clicks "Nutritional Facts" button on a fridge item.<br>2. Dialog displays nutritional information. | `ViewNutritionalFactsE2ETest#testViewNutritionalFacts_viewItemWithNutritionData` adds a test item to the fridge, clicks the "Nutritional Facts" button, verifies the nutrition dialog appears with either nutritional fields (Calories, Protein, Fat, Carbohydrates) or a "No nutritional information available" message, then clicks "Close" to dismiss the dialog. |
    | 2a. Item has no nutritional data → show "No nutritional information available". | `ViewNutritionalFactsE2ETest#testViewNutritionalFacts_viewItemWithNoNutritionData` clicks a "Nutritional Facts" button and verifies that "No nutritional information available" message appears and is displayed for items without nutrition data. |
    | Dialog displays complete nutritional information including food name. | `ViewNutritionalFactsE2ETest#testViewNutritionalFacts_dialogDisplaysCompleteInfo` adds a test item (Nutella), opens the nutritional facts dialog, verifies the dialog structure, confirms the food name "Nutella" is displayed, and verifies the "Close" button exists and is clickable. |
    | Nutritional Facts button exists on all fridge items. | `ViewNutritionalFactsE2ETest#testViewNutritionalFacts_buttonExists` adds a test item to the fridge, verifies the fridge is not empty, and confirms the "Nutritional Facts" button exists, is displayed, and has click action. |

  - **Test Logs:**
    ```
    Finished 25 tests on Pixel_7(AVD) - 13
    [XmlResultReporter]: XML test result file generated at /Users/danielding/Desktop/CPEN321/virtualfridge/frontend/app/build/outputs/androidTest-results/connected/debug/TEST-Pixel_7(AVD) - 13-_app-.xml. Total tests 25, passed 25,
    信息: Execute com.cpen321.usermanagement.e2e.ViewNutritionalFactsE2ETest.testViewNutritionalFacts_viewItemWithNutritionData: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewNutritionalFactsE2ETest.testViewNutritionalFacts_viewItemWithNoNutritionData: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewNutritionalFactsE2ETest.testViewNutritionalFacts_dialogDisplaysCompleteInfo: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.ViewNutritionalFactsE2ETest.testViewNutritionalFacts_buttonExists: PASSED
    ```

- **Use Case: Delete Fridge Item**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. User clicks "Remove" button on a fridge item.<br>2. Item is removed from the fridge. | `DeleteFridgeItemE2ETest#testDeleteFridgeItem_removeNonEmptyItem` adds a test item to the fridge, counts the initial number of "Remove" buttons (🗑Remove), clicks the first "Remove" button, waits for the item count to decrease, and verifies the final button count is less than the initial count. |
    | Remove button exists on all fridge items. | `DeleteFridgeItemE2ETest#testDeleteFridgeItem_removeButtonExists` attempts to add a test item, then verifies that fridge items have either a "Remove" or "Remove Empty Item" button that is visible and clickable. |
    | Empty items (0%) show "Remove Empty Item" button with special styling. | `DeleteFridgeItemE2ETest#testDeleteFridgeItem_removeEmptyItem` adds a test item, clicks the "Info" button to expand the card, clicks the "Adjust" button to access the slider interface, and verifies that remove buttons are available on items (tests UI for empty items at 0%). |
    | After removing last item, empty state message appears. | `DeleteFridgeItemE2ETest#testDeleteFridgeItem_emptyStateAfterRemoval` checks if the fridge is initially empty, adds one test item, verifies the item was added (remove button exists and empty state is gone), removes the item, and confirms the empty state message "is waiting to be filled!" appears and no remove buttons remain. |

  - **Test Logs:**
    ```
    Finished 25 tests on Pixel_7(AVD) - 13
    [XmlResultReporter]: XML test result file generated at /Users/danielding/Desktop/CPEN321/virtualfridge/frontend/app/build/outputs/androidTest-results/connected/debug/TEST-Pixel_7(AVD) - 13-_app-.xml. Total tests 25, passed 25,
    信息: Execute com.cpen321.usermanagement.e2e.DeleteFridgeItemE2ETest.testDeleteFridgeItem_removeButtonExists: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.DeleteFridgeItemE2ETest.testDeleteFridgeItem_removeNonEmptyItem: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.DeleteFridgeItemE2ETest.testDeleteFridgeItem_removeEmptyItem: PASSED
    信息: Execute com.cpen321.usermanagement.e2e.DeleteFridgeItemE2ETest.testDeleteFridgeItem_emptyStateAfterRemoval: PASSED
    ```

### 4.3. How to Run the Frontend Tests

The frontend tests are instrumented Android tests that run on a physical Android device or emulator. These E2E tests interact with the actual UI and make real API calls to the backend server.

#### Prerequisites

Before running the tests, ensure you have the following:

1. **Android Studio** installed with Android SDK (API level 30 or higher)
2. **Android Device or Emulator**:
3. **Google Account**: Ensure **only ONE Google account** is logged into the test device/emulator (tests use Google Sign-In)
4. **Backend Server**: The backend must be running and accessible from the test device
5. **Local Configuration**: Create a `frontend/local.properties` file with required configurations

#### Running Tests from Android Studio

1. **Open the Frontend Project**:
   - Open Android Studio
   - Select "Open an Existing Project"
   - Navigate to and select the `frontend` directory

2. **Start the Backend Server**:
   - Before running frontend tests, ensure the backend server is running
   - From the project root directory, run:
     ```bash
     cd backend
     docker compose build
     docker compose up
     ```
   - Verify the backend is accessible at the URL specified in `local.properties`

3. **Connect a Device or Start an Emulator**

4. **Navigate to the Test Files**:
   - In the Project view (left sidebar), expand: `app` → `src` → `androidTest` → `java` → `com.cpen321.usermanagement.e2e`
   - You should see all the E2E test files:
     - `LogFoodViaBarcodeE2ETest.kt`
     - `ViewFridgeE2ETest.kt`
     - `FindRecipeSuggestionsE2ETest.kt`
     - `ViewNutritionalFactsE2ETest.kt`
     - `DeleteFridgeItemE2ETest.kt`

5. **Run Tests**:

   **Run All Tests**
   - Right-click on the `e2e` folder
   - Select "Run 'Tests in 'com.cpen321.usermanagement.e2e'"
   - Select your target device from the deployment dialog
   - Click "OK"

   **Run a Single Test Class**
   - Right-click on a specific test file (e.g., `LogFoodViaBarcodeE2ETest.kt`)
   - Select "Run 'LogFoodViaBarcodeE2ETest'"
   - Select your target device
   - Click "OK"

   **Run a Single Test Method**
   - Open a test file
   - Find the test method you want to run (annotated with `@Test`)
   - Click the green play button (▶) in the left margin next to the test method
   - Select your target device
   - Click "OK"

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`65ed7f775bd9e57ad305cfe426c20ae9ea81bfb8`

### 5.2. Unfixed Issues per Codacy Category

https://app.codacy.com/gh/virtualfridge/virtualfridge/dashboard

### 5.3. Unfixed Issues per Codacy Code Pattern

https://app.codacy.com/gh/virtualfridge/virtualfridge/issues/current

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Disallow Unsafe Argument Usage](#)**
  - **Location in Git:** [`backend/src`](#) (throughout)
  - **Justification:** Eslint, with the current configuration, does not detect types provided by libraries. So every instance of a type provided/inferred by zod (and occasionally other libraries) is considered `any` when really it should be a strongly typed value. Furthermore, in any of the indicated cases it is easy to verify in vscode or another editor that the specified type is correct.

- **Code Pattern: [Enforce Unbound Methods Are Called With Their Expected Scope](#)**
  - **Location in Git:** [`backend/src/routes`](#)
  - **Justification:** These issues are still appearing in codacy. However, the functions are all arrow functions so it should not be an issue (as per the recommended resolution steps that codacy provides).

- **Code Pattern: [Promise returned in function argument where a void return was expected.](#)**
  - **Location in Git:** [`backend/src/routes`](#)
  - **Justification:** express.js (up until the most recent version, which is supposedly unstable and we aren't using) does not provide an overload for asynchronous request handlers. They do this because there isn't proper handling of thrown errors without the user doing so explicitly. However, provided that the caller always calls next(error) or handles the error themselves, there are no issues. This is the approach we have taken for all of our request handlers that are asynchronous.

- **Code Pattern: [Detect console.log() with non Literal argument](#)
  - **Location in Git:** [`backend/src/util/logger.ts`](#)
  - **Justification:** Writing to console without a literal argument is necessary for logging. All arguments are sanitized before being written to the console. 

- **Code Pattern: [Unnecessary conditional, expected left-hand side of `??` operator to be possibly null or undefined.](#)**
  - **Location in Git**: [`backend/src/util/sanitizeInput.ts:17`](#)
  - **Justification:** JSON.stringify can actually return undefined if it fails to parse the object, for example in the case of circular references. See [the official Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#return_value). Unfortunately, the typescript prototype for the function says that it only returns a string, which is incorrect.

- **Code Pattern: [Variable Assigned to Object Injection Sink](#)**
  - **Location in Git:** [`backend/src/services/recipe.ts:134`](#)
  - **Justification:**  This is only used with the statically type-checked value `nutrient` which is, by definition, a key of the object it is indexing, so there should be no issues accessing the value from that standpoint. The reasoning behind leaving this in is that it allows us to iterate over a set of 5-10 keys in the `recipe.nutrients` object, which would otherwise result in a lot of duplicate code, so doing things this way makes the code more readable and maintainable. Furthermore, all the `nutrient` keys being passed in to the function being flagged are compile-time constants, which greatly mitigates the security risk as they are not affected by used input.

- **Code Pattern: [detect Math.random()](#)**
  - **Location in Git:** [`backend/src/util/storage.ts:17`](#)
  - **Justification:** Using Math.random() is only an issue if it is being used for security/cryptographic purposes. In this file, it is only used to create a unique filename so that when saving files they will not override each other.

- **Code pattern: [Detect Non-Literal Filename in fs Calls](#)**
  - **Location in Git:** [`backend/src/services/media.ts`](#) and [`backend/src/util/storage.ts`]
  - **Justification:** We sanitize all filenames before saving and furthermore limit them to a single, pre-determined directory to limit attack surface.
