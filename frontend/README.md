# Frontend Setup

## Requirements

- [Android Studio](https://developer.android.com/studio) (latest version)
- [Java 11](https://adoptium.net/) or higher
- [Android SDK](https://developer.android.com/studio#command-tools) with API level 33+ (Android 13)
- [Kotlin](https://kotlinlang.org/) 2.0.0
- [Gradle](https://gradle.org/) 8.6.1+

## Setup

1. **Open project**: Open the project in Android Studio
2. **Sync Gradle**: Android Studio will automatically prompt you to sync the project. Click "Sync Now". You can also manually run `./gradlew build` in the terminal to trigger the sync and download the necessary dependencies.
3. **Configure Android SDK**: Ensure you have Android SDK 33 installed.
4. **Set up emulator/device**:
   - Create a new AVD (Android Virtual Device) by selecting Pixel 7 as the device and Android Tiramisu (API level 33) as the system image.
   - Alternatively, connect a physical Android device running Android 13 (API level 33).
5. **Update Google Play Service on emulator**: For the emulator, ensure that Google Play Services are up to date. Click the 3 dots beside emulator -> google play services -> update

## Build and Run

- **Setup app config**: Update the app's `./local.properties` file using the following format:

  ```
  sdk.dir=C\:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
  API_BASE_URL="http://10.0.2.2:3000/api/"
  IMAGE_BASE_URL="http://10.0.2.2:3000/"
  GOOGLE_CLIENT_ID="xxxxxxx.apps.googleusercontent.com"
  ```

  You will need to obtain a Google client ID for Google Sign-In, as described in [this google official guide](https://developer.android.com/identity/sign-in/credential-manager-siwg).

- **Debug build**: Click the green play button in the toolbar, to compile the code, package a debug APK, and install it on the connected device or running emulator
- **Release build**: Go to Build -> Generate Signed App Bundle or APK -> APK. Follow the on-screen instructions to create a key, and select the "release" build variant. You will then have to manually install the generated APK on your device or the running emulator.

## Permissions

The app requires:

- Internet access for backend communication
- Camera access for profile pictures
- Storage access for image handling

## Backend Configuration

Ensure the backend server is running and update the base URL in the app configuration if needed.
