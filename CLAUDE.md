# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Virtual Fridge is a smart kitchen companion app that helps users track food inventory, reduce waste, and plan meals. It consists of:

- **Backend**: TypeScript/Express.js REST API with MongoDB
- **Frontend**: Native Android app (Kotlin/Jetpack Compose)
- **Key Features**: Barcode scanning, image recognition for food logging, recipe generation (API + AI), nutritional information, expiration notifications

## Development Commands

### Backend (TypeScript/Express)

Located in `backend/` directory.

**Development:**
```bash
cd backend
npm install                # Install dependencies
npm run dev               # Start development server with auto-reload (nodemon + ts-node)
npm run build             # Compile TypeScript to JavaScript (outputs to dist/)
npm start                 # Run compiled JavaScript from dist/
npm run format            # Check code formatting with Prettier
npm run format:fix        # Auto-format code with Prettier
```

**Docker:**
```bash
cd backend
docker compose up         # Start backend + MongoDB containers
```

**Environment Setup:**
Create `backend/.env` with:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_USER` / `MONGODB_PASS` - MongoDB credentials
- `GEMINI_API_KEY` - Google Gemini API key for AI recipe generation

### Frontend (Android/Kotlin)

Located in `frontend/` directory.

**Requirements:**
- Android Studio (latest)
- Java 11+
- Android SDK API 33+ (Android 13)
- Kotlin 2.0.0
- Gradle 8.6.1+

**Setup:**
```bash
cd frontend
./gradlew build           # Sync project and download dependencies
```

**Environment Setup:**
Create `frontend/local.properties` with:
```
sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
API_BASE_URL="http://10.0.2.2:3000/api/"
IMAGE_BASE_URL="http://10.0.2.2:3000/"
GOOGLE_CLIENT_ID="xxxxxxx.apps.googleusercontent.com"
```

**Build & Run:**
- Debug: Use Android Studio's green play button
- Release: Build → Generate Signed App Bundle or APK

**Emulator Setup:**
- Device: Pixel 7
- System Image: Android Tiramisu (API 33)
- Update Google Play Services on emulator (3 dots menu → Google Play → Update)

## Architecture

### Backend Architecture

**Layered Structure:**
```
src/
├── index.ts              # Express app entry point
├── routes/               # Route definitions
│   └── routes.ts         # Central router (mounts all sub-routes)
├── controllers/          # Request handlers (route logic)
├── services/             # Business logic
│   ├── auth.ts           # Google OAuth verification, JWT generation
│   ├── aiRecipe.ts       # Gemini API integration for AI recipes
│   ├── fridge.ts         # Fridge management
│   └── recipe.ts         # Recipe API integration
├── models/               # Mongoose models + database operations
│   ├── User.ts           # User model with methods (create, update, delete, findById, findByGoogleId)
│   ├── foodItem.ts       # Food item model
│   └── foodType.ts       # Food type reference data
├── middleware/
│   ├── auth.ts           # JWT authentication (authenticateToken)
│   ├── validation.ts     # Zod schema validation
│   └── errorHandler.ts   # Error handling middleware
├── types/                # TypeScript types and Zod schemas
├── config/               # Configuration constants
└── util/
    ├── database.ts       # MongoDB connection (connectDB, disconnectDB)
    └── logger.ts         # Logging utilities
```

**Key Patterns:**
- **Authentication Flow**: All routes except `/api/auth/*` require JWT authentication via `authenticateToken` middleware
- **Request Validation**: Uses Zod schemas defined in `types/` for request validation via `validateBody` and `validateQuery` middleware
- **Model Pattern**: Models are classes with instance methods that wrap Mongoose operations and handle Zod validation
- **Error Handling**: Centralized error handling via `errorHandler` middleware; use `notFoundHandler` for 404s

**API Routes:**
- `/api/auth/*` - Google OAuth signup/signin (no auth required)
- `/api/user/*` - User profile management
- `/api/hobbies/*` - User hobbies
- `/api/media/*` - File uploads (stored in `uploads/` directory)
- `/api/fridge/*` - Fridge inventory operations
- `/api/food-item/*` - Individual food items
- `/api/food-type/*` - Food type reference data
- `/api/recipes/*` - Recipe generation (TheMealDB API + Gemini AI)
- `/api/notifications/*` - Push notification management

**External Integrations:**
- **Google OAuth**: Authentication via `google-auth-library`
- **Open Food Facts API**: Nutritional data and barcode lookup
- **TheMealDB API**: Recipe database
- **Google Gemini API**: AI-powered recipe generation
- **Firebase Cloud Messaging**: Push notifications for expiration alerts

### Frontend Architecture (Android)

**MVVM + Clean Architecture:**
```
app/src/main/java/com/cpen321/usermanagement/
├── MainActivity.kt                    # App entry point
├── UserManagementApplication.kt       # Application class (Hilt setup)
├── ui/
│   ├── navigation/                    # Jetpack Navigation
│   ├── screens/                       # Composable screens
│   │   ├── AuthScreen.kt              # Google Sign-In
│   │   ├── FridgeScreen.kt            # Main inventory view
│   │   ├── ScannerScreen.kt           # Barcode scanning
│   │   ├── BarcodeResultScreen.kt     # Scanned item confirmation
│   │   ├── RecipeScreen.kt            # Recipe suggestions
│   │   └── ProfileScreen.kt           # User profile
│   ├── viewmodels/                    # ViewModels (state + business logic)
│   ├── components/                    # Reusable Composables
│   └── theme/                         # Material 3 theming
├── data/
│   ├── local/                         # DataStore (SharedPreferences)
│   ├── remote/                        # Retrofit API clients
│   └── repository/                    # Repository pattern (data abstraction)
├── di/                                # Hilt dependency injection modules
│   ├── NetworkModule.kt               # Retrofit, OkHttp setup
│   ├── DataModule.kt                  # DataStore setup
│   └── RepositoryModule.kt            # Repository bindings
└── utils/                             # Utility functions
```

**Key Technologies:**
- **UI**: Jetpack Compose with Material 3
- **DI**: Hilt (Dagger)
- **Navigation**: Jetpack Navigation Compose
- **Networking**: Retrofit + OkHttp + Gson
- **Image Loading**: Coil
- **Async**: Kotlin Coroutines
- **State**: ViewModel + StateFlow
- **Camera**: CameraX (barcode scanning with ML Kit)
- **Auth**: Google Sign-In via Credential Manager API

**Data Flow:**
1. **Screen** (Composable) observes ViewModel state
2. **ViewModel** calls Repository methods
3. **Repository** coordinates between remote API and local DataStore
4. **Remote** uses Retrofit to call backend API
5. **Local** uses DataStore for persistence (auth tokens, user preferences)

**Configuration:**
- Build config injected from `local.properties` via Gradle (see `app/build.gradle.kts`)
- API base URLs and Google Client ID are stored as `BuildConfig` constants

## Important Implementation Details

### Authentication

**Backend:**
- Google OAuth token verification in `services/auth.ts`
- JWT tokens expire after 19 hours
- User lookup by `googleId` or `_id` via `userModel.findByGoogleId()` / `findById()`
- JWT payload: `{ id: user._id }`

**Frontend:**
- Uses Google Credential Manager API for sign-in
- Stores JWT in DataStore
- Automatically includes `Authorization: Bearer <token>` header for authenticated requests

### Food Logging

**Barcode Flow:**
1. Frontend: CameraX + ML Kit scan barcode → extract barcode ID
2. Frontend: POST `/api/fridge/barcode` with barcode ID
3. Backend: Query Open Food Facts API → retrieve product data
4. Backend: Create food item in user's fridge (MongoDB)

**Image Recognition:**
- Uses OCR (planned/in-progress) to identify food from photos
- Fallback to manual selection from pre-made list

### Recipe Generation

**Dual Mode:**
1. **API Mode**: Query TheMealDB API with ingredients → return recipe list with links
2. **AI Mode**: Call Google Gemini API with ingredients → generate custom recipe in markdown format

Both modes use ingredients from user's fridge inventory.

### Notifications

**Expiration Alerts:**
- Backend uses cron scheduling to check expiring items
- Sends Firebase Cloud Messaging push notifications
- User-configurable notification window (e.g., 48 hours before expiry)
- FCM token stored in User model (`fcmToken` field)

### MongoDB Schema

**User Collection:**
- `googleId` (unique, indexed)
- `email` (unique)
- `name`
- `profilePicture`
- `bio`
- `hobbies` (array, validated against constants)
- `dietaryPreferences` (object)
- `notificationPreferences` (object)
- `fcmToken` (Firebase Cloud Messaging)

**Fridge Collection:**
- `fridge_id` (linked to `user_id`)
- `food` (array of food items with: `type`, `barcode_id`, `expiration_date`, `nutritional_info`)

**Food Expiration Reference Collection:**
- `food_type` → `shelf_life_days` mapping for default expiration calculation

## Common Development Patterns

### Adding a New API Endpoint (Backend)

1. Define types/schemas in `src/types/<feature>.ts` using Zod
2. Create service in `src/services/<feature>.ts` with business logic
3. Create controller in `src/controllers/<feature>.ts` (if complex logic)
4. Create route file in `src/routes/<feature>.ts`
5. Mount route in `src/routes/routes.ts` with `authenticateToken` middleware if needed
6. Add validation middleware using `validateBody` or `validateQuery`

### Adding a New Screen (Frontend)

1. Create Composable in `ui/screens/<ScreenName>.kt`
2. Create ViewModel in `ui/viewmodels/<ScreenName>ViewModel.kt`
3. Define API endpoint in `data/remote/` (if needed)
4. Update Repository in `data/repository/` (if needed)
5. Add navigation route in `ui/navigation/`
6. Inject dependencies via Hilt constructors

### Working with Models (Backend)

Models are **class-based** with instance methods:
```typescript
// Use existing instance
await userModel.create(googleUserInfo);
await userModel.findById(userId);
await userModel.update(userId, updates);
await userModel.delete(userId);
```

Models handle Zod validation internally and throw descriptive errors.

## Testing & Quality

### Backend

- Use Prettier for formatting (`npm run format:fix`)
- TypeScript strict mode enabled
- Error handling: catch errors in services/controllers, let `errorHandler` middleware format responses

### Frontend

- Test on emulator (API 33) and physical devices
- Camera features require physical device or emulator with camera support
- Google Sign-In requires correct `GOOGLE_CLIENT_ID` and Play Services update

## Common Pitfalls

1. **Backend Environment Variables**: Ensure all required env vars are set in `.env` before running. Missing `JWT_SECRET` or `MONGODB_*` will cause startup failures.

2. **Frontend local.properties**: Must use correct format with escaped backslashes for Windows paths. Emulator uses `10.0.2.2` to access host machine's localhost.

3. **MongoDB Authentication**: Connection uses `auth.username` and `auth.password` with `authSource: 'admin'` (configured by MongoDB Docker image).

4. **File Uploads**: The `uploads/` directory must exist and have write permissions. Files are served at `/uploads/<filename>`.

5. **Barcode Scanning**: Requires ML Kit model which downloads on first use. Ensure emulator/device has network access.

6. **TypeScript Compilation**: The backend `dist/` directory is gitignored. Always run `npm run build` before `npm start` in production.

7. **Android Build Config**: Don't hardcode sensitive values. Use `local.properties` and `BuildConfig` constants.

## Documentation

See `documentation/Requirements_and_Design.md` for:
- Detailed use cases and sequence diagrams
- Non-functional requirements (barcode scan < 5s, image recognition ≥95% accuracy, app load < 2.5s)
- Screen mockups and dependency diagrams
- Database schema details
