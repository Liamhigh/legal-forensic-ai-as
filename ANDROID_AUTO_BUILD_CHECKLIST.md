# ✅ Android Studio Auto-Build Checklist

Use this checklist to ensure smooth automatic building in Android Studio.

## Before Opening in Android Studio

### Prerequisites ✓
- [ ] Android Studio installed (latest version)
- [ ] JDK 11 or higher installed
- [ ] Internet connection available
- [ ] At least 8GB RAM
- [ ] At least 10GB free disk space

### Project Setup ✓
- [ ] Repository cloned: `git clone https://github.com/Liamhigh/legal-forensic-ai-as.git`
- [ ] Node.js dependencies installed: `npm install` (in project root)
- [ ] Web app built: `npm run build` (in project root)
- [ ] Capacitor synced: `npm run android:build` (in project root)

### Verification ✓
- [ ] Run preflight check: `./preflight-check.sh` (from project root)
- [ ] All checks pass or only warnings shown
- [ ] `android` folder exists and contains `build.gradle`

## Opening in Android Studio

### Open Project ✓
- [ ] Launch Android Studio
- [ ] Click: `File` → `Open`
- [ ] Navigate to: `android` folder (NOT the project root)
- [ ] Click: `OK`

### First-Time Gradle Sync ✓
- [ ] Gradle sync starts automatically (status bar shows progress)
- [ ] Wait 5-10 minutes for first sync
- [ ] Accept any SDK component installation prompts
- [ ] Status bar shows: "Gradle Build Finished"

### Verify Auto-Build Success ✓
- [ ] No red errors in Build window
- [ ] Project structure visible in Project panel
- [ ] Status bar shows: "BUILD SUCCESSFUL"
- [ ] Run button (▶️) is enabled and green

## Running the App

### Device/Emulator Setup ✓
Choose one:

**Option A: Physical Device**
- [ ] USB debugging enabled on device
- [ ] Device connected via USB
- [ ] Device shown in device dropdown

**Option B: Emulator**
- [ ] AVD created (Tools → Device Manager)
- [ ] Emulator selected in device dropdown

### Launch App ✓
- [ ] Select device/emulator from dropdown
- [ ] Click Run button (▶️) or press Shift+F10
- [ ] App installs automatically
- [ ] App launches and shows Verum Omnis interface

### Verify App Functionality ✓
- [ ] App shows company logos in header
- [ ] No crash on launch
- [ ] UI elements visible and responsive
- [ ] Can navigate between sections

## Subsequent Builds

After the first successful build, subsequent builds should be fast:

### Expected Times ✓
- [ ] Gradle sync: 30-60 seconds
- [ ] Clean build: 1-3 minutes
- [ ] Incremental build: 10-30 seconds
- [ ] Hot reload: 5-10 seconds

### Performance Indicators ✓
- [ ] Build times consistently under 2 minutes
- [ ] No repeated downloads of dependencies
- [ ] Configuration cache hits shown in logs
- [ ] Build cache utilized

## Troubleshooting

If automatic build fails, try these in order:

### Level 1: Simple Fixes ✓
- [ ] Sync Project: `File` → `Sync Project with Gradle Files`
- [ ] Clean Build: `Build` → `Clean Project`
- [ ] Rebuild: `Build` → `Rebuild Project`

### Level 2: Cache Clearing ✓
- [ ] Invalidate Caches: `File` → `Invalidate Caches` → `Invalidate and Restart`
- [ ] Delete `.gradle` and `build` folders in android directory
- [ ] Re-open project

### Level 3: Fresh Start ✓
- [ ] Close Android Studio
- [ ] Delete `android/local.properties`
- [ ] Delete `android/.idea` folder (if exists)
- [ ] Delete `android/.gradle` folder
- [ ] Re-run: `npm run android:build` from project root
- [ ] Re-open in Android Studio

### Level 4: Network Issues ✓
- [ ] Check internet connection
- [ ] Disable VPN if active
- [ ] Check firewall allows Maven repository access
- [ ] Try using mobile hotspot if corporate network blocks Maven

## Success Criteria

Your build is successful when:

1. ✅ Gradle sync completes without errors
2. ✅ "BUILD SUCCESSFUL" shown in Build output
3. ✅ No red errors in Problems tab
4. ✅ App installs on device/emulator
5. ✅ App launches without crashes
6. ✅ All features work as expected

## Build Optimization Tips

To maintain fast automatic builds:

### DO ✓
- [ ] Keep Gradle daemon enabled (already configured)
- [ ] Let configuration cache warm up (first few builds)
- [ ] Close unused projects in Android Studio
- [ ] Keep Android Studio updated
- [ ] Restart Android Studio if builds slow down

### DON'T ✗
- [ ] Don't disable build cache
- [ ] Don't disable parallel execution
- [ ] Don't manually delete Gradle cache during normal use
- [ ] Don't open multiple Gradle projects simultaneously
- [ ] Don't run builds while antivirus is scanning project

## Getting Help

If you still have issues:

1. Check logs: `android/build/reports/`
2. Review documentation:
   - `../ANDROID_STUDIO_QUICKSTART.md`
   - `../ANDROID_BUILD.md`
   - `README.md`
3. Check Gradle version: `./gradlew --version`
4. Verify SDK: Check `local.properties` has correct path

---

## Quick Reference

**Open project**: `File` → `Open` → Select `android` folder
**Sync Gradle**: `File` → `Sync Project with Gradle Files`
**Clean build**: `Build` → `Clean Project`
**Rebuild**: `Build` → `Rebuild Project`
**Run app**: Click ▶️ or Shift+F10
**Stop app**: Click ⏹ or Ctrl+F2

---

**Status**: Ready for automatic build! ✅
