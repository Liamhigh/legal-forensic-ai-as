# GitHub Actions Release Workflow Simulator

## Overview

This script (`simulate-release-workflow.sh`) simulates the `build-release` job from `.github/workflows/android-build.yml` to verify that the release workflow will succeed in CI before pushing changes.

## What It Does

The simulator runs through all steps of the GitHub Actions release workflow:

1. **CI Guard Checks** - Security verification to prevent signing regressions
2. **Node.js Environment** - Verifies Node 18+ is installed
3. **Install Dependencies** - Runs `npm ci`
4. **Build Web Application** - Runs `npm run build`
5. **Java/JDK Environment** - Verifies JDK 17+ is installed
6. **Capacitor Sync** - Runs `npx cap sync android` and checks for file modifications
7. **Android Environment** - Verifies Android SDK and Gradle wrapper
8. **Signing Configuration** - Analyzes signing setup and explains failure paths
9. **Gradle assembleRelease** - Builds the release APK (signed or unsigned)
10. **Verify Release APK** - Confirms APK was created
11. **APK Signature Verification** - Verifies APK signature if signed
12. **Build Information** - Extracts app version details

## Usage

### Basic Usage (No Signing)

```bash
./simulate-release-workflow.sh
```

This will simulate an unsigned build, which is what happens in CI when secrets are not configured.

### Simulating Signed Build (With Signing Credentials)

To fully simulate a signed release build, you need to provide signing credentials:

#### Option 1: Environment Variables

```bash
export KEYSTORE_BASE64='<base64-encoded-keystore>'
export KEYSTORE_PASSWORD='your-keystore-password'
export KEY_ALIAS='your-key-alias'
export KEY_PASSWORD='your-key-password'

./simulate-release-workflow.sh
```

To create a base64-encoded keystore:
```bash
base64 -i your-keystore.jks | tr -d '\n' > keystore.base64.txt
export KEYSTORE_BASE64=$(cat keystore.base64.txt)
```

#### Option 2: Local Keystore + signing.properties

1. Place your keystore at `android/app/keystore.jks` (this file is gitignored)
2. Create `android/signing.properties` with:
   ```properties
   KEYSTORE_PASSWORD=your-password
   KEY_ALIAS=your-alias
   KEY_PASSWORD=your-password
   ```

Then run:
```bash
./simulate-release-workflow.sh
```

## Output

The script provides:

- ✅ **Success indicators** - Steps that passed
- ❌ **Error indicators** - Steps that would fail in CI
- ⚠️ **Warning indicators** - Potential CI divergence issues

### Exit Codes

- `0` - All checks passed (no errors)
- `1` - One or more checks failed (would fail in CI)

### Example Output

```
🚀 GitHub Actions Release Workflow Simulation
==============================================

This script simulates the build-release job from:
  .github/workflows/android-build.yml

It will verify:
  1. CI Guards (security checks)
  2. Node.js build
  3. Capacitor sync (file modification check)
  4. Gradle assembleRelease with signing
  5. APK signature verification

========================================
STEP 1: CI Guard - Security Checks
========================================
✅ No masked placeholders found in workflow
✅ No SHA-256 signing references found

[... more output ...]

========================================
SUMMARY
========================================

📊 Simulation Results:

✅ All checks passed!

The release workflow should succeed in CI.

📋 CI vs Local Divergence Analysis:

⚠️  No signing credentials (diverges from CI with secrets configured)
✅ Node.js version compatible with CI (18+)
✅ Android SDK configured
```

## Failure Path Analysis

### Without Signing Credentials (No Secrets)

When `KEYSTORE_BASE64` is not set, the script explains what happens in CI:

```
📋 FAILURE PATH WITHOUT SECRETS:
1. Keystore decode step will be SKIPPED (if condition false)
2. Signed release APK build step will be SKIPPED (if condition false)
3. APK signature verification step will be SKIPPED (if condition false)
4. UNSIGNED release APK build step will RUN instead
5. The workflow will complete but produce an UNSIGNED APK

⚠️  CRITICAL: The unsigned APK CANNOT be installed on production devices
⚠️  The unsigned APK CANNOT be published to Google Play Store
```

This explicit reasoning helps identify:
- Which steps would be skipped
- What the final artifact would be (unsigned APK)
- Whether the build would succeed or fail
- Production deployment viability

## CI vs Local Divergence Detection

The script identifies differences between local and CI environments:

### Environment Differences
- **Node.js version** - CI uses Node 18, warns if local differs
- **Java version** - CI uses JDK 17, warns if local differs
- **Android SDK** - CI auto-configures, warns if not set locally
- **Signing credentials** - CI has secrets, warns if missing locally

### File Modification Detection

The script specifically checks if `npx cap sync android` modifies tracked files:

```
✅ Capacitor sync did not modify tracked files
ℹ️  Untracked files may have been created (this is normal)
```

If modifications are detected:
```
❌ Capacitor sync modified tracked files
   This could cause CI to fail if the workflow expects no modifications

   Modified tracked files:
   android/app/src/main/assets/capacitor.config.json

   💡 POTENTIAL CI DIVERGENCE:
   If these modifications happen in CI but are not committed,
   subsequent builds may fail or produce different artifacts.
```

## Common Issues and Solutions

### Issue: "Node.js version is below 18"
**Solution:** Install or switch to Node.js 18+
```bash
nvm install 18
nvm use 18
```

### Issue: "Java version is below 17"
**Solution:** Install or switch to JDK 17+
```bash
# On macOS with Homebrew
brew install openjdk@17

# On Ubuntu
sudo apt-get install openjdk-17-jdk
```

### Issue: "ANDROID_HOME not set"
**Solution:** Set ANDROID_HOME environment variable
```bash
export ANDROID_HOME=$HOME/Android/Sdk  # Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
```

### Issue: "Gradle assembleRelease failed"
**Possible causes:**
1. Network issues (can't download dependencies)
2. Missing Android SDK components
3. Incorrect signing configuration
4. Gradle configuration errors

**Solution:** Check error output for specific cause

### Issue: "APK signature verification FAILED"
**Possible causes:**
1. Wrong keystore used during build
2. Incorrect keystore password or alias
3. Signing config not applied to release build

**Solution:** Verify all signing parameters are correct

## Requirements

### Required Tools
- Node.js 18+ (matching CI)
- npm
- JDK 17+ (matching CI)
- Android SDK (ANDROID_HOME set)
- Gradle (via wrapper)

### Optional Tools
- `apksigner` (for APK signature verification)
- `zipinfo` (for basic signature detection)

## Integration with CI/CD

### Pre-Push Hook

Add to `.git/hooks/pre-push`:
```bash
#!/bin/bash
echo "Running release workflow simulation..."
./simulate-release-workflow.sh
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Release workflow simulation failed!"
    echo "Fix issues above before pushing."
    exit 1
fi
```

### Make it executable:
```bash
chmod +x .git/hooks/pre-push
```

### In Pull Request Checks

Run the simulator as part of PR validation:
```bash
# In your PR check script
./simulate-release-workflow.sh || {
    echo "Release workflow simulation failed"
    exit 1
}
```

## Limitations

The simulator cannot perfectly replicate:

1. **Exact CI environment** - Different OS, system libraries, etc.
2. **GitHub secrets** - Simulates absence or requires manual setup
3. **Network conditions** - CI may have different network access
4. **Concurrent builds** - Cannot simulate parallel CI jobs

However, it catches most common issues:
- Build failures
- Signing configuration errors
- File modification issues
- Environment mismatches

## Troubleshooting

### Script Won't Execute
```bash
chmod +x simulate-release-workflow.sh
```

### Permission Denied for gradlew
```bash
chmod +x android/gradlew
```

### Can't Find apksigner
```bash
# Add Android SDK build-tools to PATH
export PATH=$ANDROID_HOME/build-tools/*/bin:$PATH
```

## Related Files

- `.github/workflows/android-build.yml` - The actual CI workflow
- `android/app/build.gradle` - Signing configuration
- `android/build.gradle` - Build tool versions
- `.gitignore` - Excludes build artifacts and signing keys

## Security Notes

⚠️ **NEVER commit signing keys or passwords!**

- `*.jks` and `*.keystore` are in `.gitignore`
- Use environment variables or local files for credentials
- Keep `signing.properties` local (add to `.gitignore` if needed)
- Base64-encoded keystores are also sensitive - don't commit them

## Contributing

When modifying this script:

1. Keep it in sync with `.github/workflows/android-build.yml`
2. Update this README with any new features
3. Test with both signed and unsigned scenarios
4. Ensure failure paths are clearly explained
