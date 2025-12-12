# Building the Android App

This guide explains how to build the Verum Omnis Android application.

## Prerequisites

- Node.js (v18 or higher)
- Android Studio (for building and running the app)
- Java Development Kit (JDK) 11 or higher

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the web application**
   ```bash
   npm run build
   ```

3. **Sync to Android**
   ```bash
   npx cap sync android
   ```

## Development

### Building for Android

To build the Android app and sync all changes:

```bash
npm run android:build
```

This command will:
- Build the web application
- Sync web assets to Android
- Copy all necessary files to the Android project

### Opening in Android Studio

To open the project in Android Studio:

```bash
npm run android:open
```

Or manually navigate to the `android` directory in Android Studio.

### Running on Device/Emulator

To build and run on a connected device or emulator:

```bash
npm run android:run
```

Or build and run from Android Studio after opening the project.

## Project Structure

- `/android` - Native Android project (Capacitor-generated)
- `/dist` - Built web application assets
- `/src` - React source code
- `/android/app/src/main/assets/public/pdfs` - PDF documents accessible in the app

## Features

The Android app includes:
- Full Verum Omnis legal forensics AI interface
- Access to the Master Forensic Archive PDF (v5.2.7 Institutional Edition)
- **Cryptographic Document Sealing**: All uploaded documents are cryptographically sealed with SHA-256 hash
- **Geolocation Integration**: Captures location data for jurisdictional compliance and accurate timestamps
- **Seal Verification**: Previously sealed documents are verified, not re-sealed
- Native Android performance through Capacitor
- Offline capabilities with bundled assets

## Automated Builds with GitHub Actions

The repository includes a GitHub Actions workflow that automatically builds APKs:
- **Debug APK**: Built on every push and pull request
- **Signed Release APK**: Built on main branch with signing keys configured

See [SIGNING_SETUP.md](./SIGNING_SETUP.md) for instructions on configuring signing keys.

The workflow:
1. Builds the web application
2. Syncs to Android platform
3. Builds debug/release APK
4. Uploads as artifacts
5. Creates GitHub releases (for main branch)

## Building APK/AAB Manually

### Debug APK
From Android Studio:
1. Open the project with `npm run android:open`
2. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
3. APK will be generated in `android/app/build/outputs/apk/debug/`

### Release Build
From Android Studio:
1. Open the project with `npm run android:open`
2. Go to Build > Generate Signed Bundle / APK
3. Follow the wizard to create a signed release build

Or via command line:
```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Build Errors

If you encounter build errors, try:

1. Clean the build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. Rebuild:
   ```bash
   npm run android:build
   ```

3. Invalidate caches in Android Studio:
   - File > Invalidate Caches / Restart

### PDF Not Loading

Ensure the PDF is synced:
```bash
npm run build
npx cap copy android
```

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
