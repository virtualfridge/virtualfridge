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

`f31e08b869aac335ab459518474b78d0b8ac69b3`

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

_(Placeholder for Jest coverage screenshot without mocking)_

### 2.4. Jest Coverage Report Screenshots for Tests With Mocking

_(Placeholder for Jest coverage screenshot with mocking)_

### 2.5. Jest Coverage Report Screenshots for Both Tests With and Without Mocking

_(Placeholder for Jest coverage screenshot both with and without mocking)_

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

`frontend/src/androidTest/java/com/studygroupfinder/`

### 4.2. Tests

- **Use Case: Login**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user opens "Add Todo Items" screen. | Open "Add Todo Items" screen. |
    | 2. The app shows an input text field and an "Add" button. The add button is disabled. | Check that the text field is present on screen.<br>Check that the button labelled "Add" is present on screen.<br>Check that the "Add" button is disabled. |
    | 3a. The user inputs an ill-formatted string. | Input "_^_^^OQ#$" in the text field. |
    | 3a1. The app displays an error message prompting the user for the expected format. | Check that a dialog is opened with the text: "Please use only alphanumeric characters ". |
    | 3. The user inputs a new item for the list and the add button becomes enabled. | Input "buy milk" in the text field.<br>Check that the button labelled "add" is enabled. |
    | 4. The user presses the "Add" button. | Click the button labelled "add ". |
    | 5. The screen refreshes and the new item is at the bottom of the todo list. | Check that a text box with the text "buy milk" is present on screen.<br>Input "buy chocolate" in the text field.<br>Click the button labelled "add".<br>Check that two text boxes are present on the screen with "buy milk" on top and "buy chocolate" at the bottom. |
    | 5a. The list exceeds the maximum todo-list size. | Repeat steps 3 to 5 ten times.<br>Check that a dialog is opened with the text: "You have too many items, try completing one first". |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **Use Case: ...**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | ...                | ...                 |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **...**

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`[Insert Commit SHA here]`

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacy's Category Breakdown table in Overview)_

### 5.3. Unfixed Issues per Codacy Code Pattern

_(Placeholder for screenshots of Codacy's Issues page)_

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Usage of Deprecated Modules](#)**

  1. **Issue**

     - **Location in Git:** [`src/services/chatService.js#L31`](#)
     - **Justification:** ...

  2. ...

- ...
