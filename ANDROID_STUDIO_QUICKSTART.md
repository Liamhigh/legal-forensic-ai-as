# Quick Start Guide: Building in Android Studio

## Prerequisites Check
Before you begin, ensure you have:
- ✅ Android Studio (latest version) installed
- ✅ JDK 17 or higher installed
- ✅ Node.js 18+ and npm installed
- ✅ Git installed

## Step-by-Step Android Studio Build

### Step 1: Clone and Setup (5 minutes)
```bash
# Clone the repository
git clone https://github.com/Liamhigh/legal-forensic-ai-as.git
cd legal-forensic-ai-as

# Install Node dependencies
npm install
```

### Step 2: Build Web Assets (2 minutes)
```bash
# Build the web application
npm run build

# Sync to Android with Capacitor
npm run android:build
```

**Expected Output**:
```
✓ built in ~10s
✔ Copying web assets from dist to android/app/src/main/assets/public
✔ copy android in ~100ms
✔ update android in ~90ms
[info] Sync finished in 0.2s
```

### Step 3: Configure Android SDK (1 minute - if needed)

Android Studio will automatically create a `local.properties` file when you first open the project. However, if you need to create it manually:

```bash
cd android
cp local.properties.template local.properties
# Edit the file and set your SDK path
```

**Common SDK locations:**
- **Windows**: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
- **Mac**: `/Users/YourUsername/Library/Android/sdk`
- **Linux**: `/home/YourUsername/Android/Sdk`

**Note**: If Android Studio is already installed, it will handle this automatically when you open the project.

### Step 4: Open in Android Studio (1 minute)
```bash
# Option A: Use npm script
npm run android:open

# Option B: Open Android Studio manually
# File > Open > Navigate to: legal-forensic-ai-as/android/
```

### Step 5: Wait for Gradle Sync (5-10 minutes first time)
1. Android Studio will automatically start Gradle sync
2. Wait for "Gradle Build Finished" in bottom status bar
3. If prompted, accept any SDK or build tool updates
4. **Common issue**: If sync fails, click "Sync Project with Gradle Files" button

### Step 6: Verify Project Structure
Check that these are visible in Project panel (Android view):
```
app/
├── manifests/
│   └── AndroidManifest.xml
├── java/
│   └── com.verumomnis.forensics/
│       └── MainActivity.java
├── assets/
│   └── public/
│       ├── assets/
│       │   ├── company-logo-1.jpg  ← NEW
│       │   ├── company-logo-2.jpg  ← NEW
│       │   └── watermark.png       ← NEW
│       └── index.html
└── build.gradle
```

### Step 7: Build and Run (3-5 minutes)

#### Option A: Run on Physical Device
1. **Enable USB Debugging** on your Android device:
   - Settings > About Phone > Tap "Build Number" 7 times
   - Settings > Developer Options > Enable "USB Debugging"
2. **Connect device** via USB cable
3. **Select device** from dropdown in Android Studio toolbar
4. **Click Run** (green play button) or press Shift+F10
5. **Accept** USB debugging prompt on device if shown

#### Option B: Run on Emulator
1. **Create AVD** (if not exists):
   - Tools > Device Manager
   - Click "Create Device"
   - Select "Pixel 6" or similar
   - Select Android 13 (API 33) or higher
   - Finish
2. **Start Emulator**:
   - Select emulator from dropdown
   - Click Run (green play button)
   - Wait for emulator to boot (~1 minute)
3. **App installs automatically**

### Step 7: Grant Permissions (First Launch)
When app first launches:
1. **Location Permission**: Tap "Allow" (needed for geolocation stamping)
2. **Storage Permission**: Tap "Allow" (needed for document access)

### Step 8: Test Core Features (5 minutes)

#### Test 1: Verify Logos
- ✓ Open app
- ✓ Check header - should see two logos flanking "VERUM OMNIS"
- ✓ Logos should be circular and professional-looking

#### Test 2: Upload and Seal Document
- ✓ Scroll to "Forensic Document Sealing"
- ✓ Tap "Upload Document to Seal"
- ✓ Select any text file
- ✓ Wait for "Document sealed cryptographically" toast
- ✓ Verify seal information shows hash and location

#### Test 3: Generate Report
- ✓ Scroll to "Generate Forensic Report"
- ✓ Check "Include watermark indicator"
- ✓ Tap "View Watermark" - should open watermark image
- ✓ Optional: Enter password in password field
- ✓ Tap "Generate & Download Report"
- ✓ Check Downloads folder for report file

#### Test 4: AI Conversation
- ✓ Tap one of suggested prompts OR type your own
- ✓ Wait for AI response
- ✓ Verify response includes forensic disclaimers
- ✓ Scroll down - ReportGenerator should appear with conversation content

## Troubleshooting

### Problem: Gradle Sync Fails
**Solution 1**: Update Gradle
```bash
cd android
./gradlew wrapper --gradle-version=8.2
```

**Solution 2**: Clean and rebuild
```bash
cd android
./gradlew clean
./gradlew build
```

**Solution 3**: Invalidate caches
- File > Invalidate Caches > Invalidate and Restart

### Problem: App Won't Install
**Error**: "Installation failed: INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Solution**: Uninstall existing app first
```bash
adb uninstall com.verumomnis.forensics
```

### Problem: Logos Not Showing
**Solution**: Re-sync assets
```bash
# From project root
npm run android:build
# Then rebuild in Android Studio
```

### Problem: "Could not find or load main class"
**Solution**: Set JAVA_HOME environment variable
```bash
# On Mac/Linux
export JAVA_HOME=/path/to/jdk-17

# On Windows
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

### Problem: Geolocation Not Working
**Solution**: 
1. Grant location permission in app
2. Enable location services in Android settings
3. For emulator: Use Extended Controls to set location

### Problem: Assets Not Loading
**Symptoms**: Blank screen or missing content
**Solution**:
```bash
# Re-sync Capacitor
npx cap sync android --force

# Rebuild in Android Studio
# Build > Rebuild Project
```

## Building Release APK

### For Testing (Debug APK)
1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. Wait for build to complete
3. Click "locate" in notification
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Production (Release APK)
1. **Generate signing key** (one-time):
```bash
keytool -genkey -v -keystore ~/verum-omnis.keystore \
  -alias verum-omnis -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing** in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file("/path/to/verum-omnis.keystore")
            storePassword "YOUR_PASSWORD"
            keyAlias "verum-omnis"
            keyPassword "YOUR_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

3. **Build release APK**:
```bash
cd android
./gradlew assembleRelease
```

4. **Locate APK**:
   - `android/app/build/outputs/apk/release/app-release.apk`

## Next Steps After Successful Build

1. **Test All Features**: Use the checklist in Step 8
2. **Share APK**: Send `app-debug.apk` to testers
3. **Prepare for Play Store**: Build signed release APK
4. **Customize**: Update logos, colors, branding as needed

## Performance Tips

### Optimize Build Time
```bash
# Enable Gradle daemon
echo "org.gradle.daemon=true" >> android/gradle.properties

# Increase heap size
echo "org.gradle.jvmargs=-Xmx4096m" >> android/gradle.properties

# Enable parallel builds
echo "org.gradle.parallel=true" >> android/gradle.properties
```

### Reduce APK Size
- Use `minifyEnabled true` in release builds
- Enable ProGuard/R8 optimization
- Use WebP images instead of PNG where possible

## Expected Build Times

- **First Gradle Sync**: 5-10 minutes
- **Subsequent Syncs**: 30-60 seconds
- **Clean Build**: 3-5 minutes
- **Incremental Build**: 30-90 seconds
- **Hot Reload**: 5-10 seconds

## Verification Checklist

Before considering build successful, verify:
- [x] Gradle sync completed without errors
- [x] App builds successfully (no build errors)
- [x] App installs on device/emulator
- [x] App launches without crashes
- [x] Logos appear in header
- [x] Document upload works
- [x] Report generation works
- [x] Watermark displays correctly
- [x] Permissions granted successfully
- [x] No console errors in Logcat

## Success Indicators

You'll know the build is successful when:
1. ✅ Android Studio shows "BUILD SUCCESSFUL" in Build tab
2. ✅ App installs on device without errors
3. ✅ App opens and shows Verum Omnis interface with logos
4. ✅ All features work as expected
5. ✅ No crashes or ANR (Application Not Responding) errors

## Need Help?

### Check Documentation
- `GEMINI_INSTRUCTIONS.md` - Complete application documentation
- `ANDROID_BUILD.md` - Detailed Android build instructions
- `LOGO_WATERMARK_INTEGRATION.md` - Technical details
- `TROUBLESHOOTING.md` - Common issues and solutions

### Common Commands
```bash
# Re-sync everything
npm run android:build

# Force clean build
cd android && ./gradlew clean && cd .. && npm run android:build

# Check Capacitor status
npx cap doctor

# View logs
adb logcat | grep -i capacitor
```

### Android Studio Shortcuts
- **Build**: Ctrl+F9 (Windows/Linux) or Cmd+F9 (Mac)
- **Run**: Shift+F10 (Windows/Linux) or Ctrl+R (Mac)
- **Clean**: Build > Clean Project
- **Rebuild**: Build > Rebuild Project

## Summary

**Total Time to First Build**: ~15-20 minutes
- Setup: 5 min
- Build: 2 min
- Android Studio Sync: 5-10 min
- Run & Test: 5 min

**Ongoing Build Time**: ~3-5 minutes per iteration

**Ready to Deploy**: Yes, APK can be shared immediately

You now have a fully functional Android application with:
- Professional company branding (dual logos)
- Cryptographic document sealing
- Forensic report generation with watermarks
- Password-protected reports
- AI-powered legal analysis
- Constitutional enforcement layer

**Build Status**: ✅ Ready for Android Studio
