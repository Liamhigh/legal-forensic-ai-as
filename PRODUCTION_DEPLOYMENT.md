# Production Deployment Guide for Verum Omnis Forensic AI

## 🚀 Quick Start: Production APK Signing

Your GitHub Actions workflow is **already configured** to build production-ready signed APKs. You just need to set up signing credentials.

### Current Status

✅ **GitHub Actions workflow is production-ready**
✅ **Android build configuration is complete**
✅ **Automatic APK signing is configured**
✅ **Signature verification is automated**
✅ **GitHub Releases are automated**

**What You Need**: Configure 4 GitHub secrets to enable signed APK builds.

---

## Step 1: Generate Signing Keys (One-Time Setup)

### Option A: Generate New Keystore (Recommended for new apps)

Run this command on your local machine:

```bash
keytool -genkey -v -keystore verum-omnis-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias verum-omnis-key
```

You'll be prompted to provide:
- **Keystore password**: Choose a strong password (min 12 characters)
- **Key password**: Choose a strong password (can be same as keystore)
- **Your name**: Enter your full name
- **Organizational unit**: e.g., "Development"
- **Organization**: e.g., "Verum Omnis"
- **City/Locality**: Your city
- **State/Province**: Your state
- **Country code**: Two-letter country code (e.g., US, GB, CA)

**⚠️ CRITICAL**: Save these passwords securely! You'll need them to configure GitHub secrets and to update your app in the future.

**⚠️ BACKUP**: Store your keystore file (`verum-omnis-release.jks`) in a secure location. If you lose it, you cannot update your app on Google Play Store.

### Option B: Use Existing Keystore

If you already have a keystore from a previous app or signing setup, you can use that instead.

---

## Step 2: Encode Keystore to Base64

GitHub Actions needs your keystore in base64 format for secure storage.

### On macOS/Linux:

```bash
base64 -i verum-omnis-release.jks -o keystore.txt
```

### On Windows (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("verum-omnis-release.jks")) | Out-File keystore.txt
```

This creates a `keystore.txt` file containing the base64-encoded keystore.

---

## Step 3: Configure GitHub Secrets (REQUIRED)

### 3.1 Navigate to GitHub Settings

1. Go to your repository on GitHub: https://github.com/Liamhigh/legal-forensic-ai-as
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 3.2 Add Required Secrets

Add these **4 secrets** (all are required):

| Secret Name | Value | Description |
|------------|-------|-------------|
| `KEYSTORE_BASE64` | Entire content of `keystore.txt` | Base64-encoded keystore file |
| `KEYSTORE_PASSWORD` | Your keystore password | Password you used when creating the keystore |
| `KEY_ALIAS` | `verum-omnis-key` | The alias you used (default: `verum-omnis-key`) |
| `KEY_PASSWORD` | Your key password | Password for the key (may be same as keystore password) |

**⚠️ IMPORTANT**: 
- All 4 secrets must be configured for signed builds to work
- Use the exact names shown above (case-sensitive)
- Do not add quotes or extra whitespace
- Keep these secrets confidential

### 3.3 Verify Alias Name

If you're not sure what alias you used, check your keystore:

```bash
keytool -list -v -keystore verum-omnis-release.jks
```

Look for "Alias name:" in the output.

---

## Step 4: Trigger Production Build

Once secrets are configured, GitHub Actions will automatically build signed APKs.

### Automatic Trigger (Recommended)

Push any change to the `main` branch:

```bash
git checkout main
git pull
# Make any change or just push
git push origin main
```

### Manual Trigger

1. Go to GitHub Actions: https://github.com/Liamhigh/legal-forensic-ai-as/actions
2. Click on **Build Android APK** workflow
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

---

## Step 5: Download Your Signed APK

### From GitHub Actions Artifacts

1. Go to Actions: https://github.com/Liamhigh/legal-forensic-ai-as/actions
2. Click on the latest successful workflow run
3. Scroll to **Artifacts** section
4. Download **verum-omnis-release** (signed APK)

### From GitHub Releases

The workflow automatically creates a GitHub Release with the signed APK attached:

1. Go to Releases: https://github.com/Liamhigh/legal-forensic-ai-as/releases
2. Download the latest release APK
3. File will be named: `app-release.apk`

---

## Step 6: Verify APK Signature (Optional but Recommended)

Verify your APK is properly signed before distributing:

### Using apksigner (from Android SDK):

```bash
apksigner verify --print-certs app-release.apk
```

**Expected output:**
```
Verified using v1 scheme (JAR signing): true
Verified using v2 scheme (APK Signature Scheme v2): true
Number of signers: 1
Signer #1 certificate DN: CN=...
Signer #1 certificate SHA-256 digest: ...
```

### Using jarsigner:

```bash
jarsigner -verify -verbose -certs app-release.apk
```

**Expected output:** Should say "jar verified."

---

## Step 7: Distribute Your APK

### Option A: Internal/Enterprise Distribution

**Direct Distribution:**
- Upload to your own server
- Share via company portal
- Email to authorized users

**Requirements:**
- Users must enable "Install unknown apps" on Android devices
- Provide installation instructions
- Consider Mobile Device Management (MDM) for enterprise

### Option B: Google Play Store

**Required Steps:**

1. **Create Developer Account**
   - Go to https://play.google.com/console
   - Pay one-time $25 registration fee
   - Complete account verification

2. **Create App Listing**
   - App name: "Verum Omnis - Forensic AI"
   - Category: Business / Productivity
   - Upload screenshots and descriptions
   - Set privacy policy URL

3. **Upload APK/AAB**
   - For APK: Upload the signed `app-release.apk`
   - For AAB (recommended): Generate with `./gradlew bundleRelease`
   - Configure pricing (free or paid)

4. **Complete Content Rating**
   - Answer questionnaire about app content
   - Receive IARC rating

5. **Submit for Review**
   - Review can take 1-7 days
   - Address any policy violations

**Benefits of Play Store:**
- Automatic updates for users
- Better security and trust
- Wider distribution reach
- App statistics and crash reports

### Option C: Private Beta Testing

**Google Play Internal Testing Track:**
1. Upload to Internal Testing in Play Console
2. Add email addresses of testers
3. Testers can install via Play Store
4. Collect feedback before public release

---

## Troubleshooting

### ❌ Error: "Signing secrets are required"

**Problem**: One or more of the 4 GitHub secrets is missing.

**Solution**: 
1. Check all 4 secrets are configured in GitHub Settings
2. Verify exact spelling: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`
3. Re-add any missing secrets

### ❌ Error: "Keystore was tampered with, or password was incorrect"

**Problem**: `KEYSTORE_PASSWORD` secret doesn't match the actual keystore password.

**Solution**:
1. Verify the password you used when creating the keystore
2. Update the `KEYSTORE_PASSWORD` secret with the correct password
3. Re-run the workflow

### ❌ Error: "Could not find key alias"

**Problem**: `KEY_ALIAS` secret doesn't match the alias in your keystore.

**Solution**:
1. Check your keystore alias: `keytool -list -v -keystore verum-omnis-release.jks`
2. Update the `KEY_ALIAS` secret with the correct alias name
3. Re-run the workflow

### ❌ Error: "APK signature verification FAILED"

**Problem**: APK was built but not properly signed.

**Solution**:
1. Verify all 4 secrets are correctly configured
2. Check that `KEYSTORE_BASE64` contains the complete base64 string
3. Ensure there are no extra spaces or line breaks in secrets
4. Re-generate the base64-encoded keystore if needed

### ❌ Build succeeds but APK is unsigned

**Problem**: Build completes but signature verification shows no signatures.

**Solution**:
- This should not happen on `main` branch - the workflow will fail
- On other branches, unsigned builds are allowed for testing
- Merge to `main` to get a signed build

---

## Security Best Practices

### ✅ Do This

1. **Keep keystore offline**: Store in encrypted backup (e.g., 1Password, LastPass)
2. **Use strong passwords**: Minimum 12 characters, mix of letters/numbers/symbols
3. **Limit access**: Only authorized team members should have keystore/passwords
4. **Monitor secrets**: Review GitHub secret access logs regularly
5. **Rotate keys**: Consider rotating keys every 2-3 years
6. **Backup keystore**: Keep multiple encrypted backups in different locations

### ❌ Don't Do This

1. **Never commit keystore**: Already in `.gitignore` but double-check
2. **Never share passwords**: Use secret management tools instead
3. **Never use weak passwords**: "password123" is not acceptable
4. **Never lose keystore**: You cannot recover or regenerate it
5. **Never hardcode credentials**: Always use GitHub Secrets or environment variables

---

## Build Workflow Details

### What Happens Automatically

When you push to `main` branch, GitHub Actions:

1. ✅ Checks out your code
2. ✅ Installs Node.js dependencies
3. ✅ Builds the web application (`npm run build`)
4. ✅ Sets up Java 17 and Android SDK
5. ✅ Syncs Capacitor to Android project
6. ✅ Decodes keystore from `KEYSTORE_BASE64` secret
7. ✅ Builds signed release APK with Gradle
8. ✅ Verifies APK signature with `apksigner`
9. ✅ Uploads APK as workflow artifact
10. ✅ Creates GitHub Release with APK attached

### Build Outputs

Each build produces:

**Debug APK** (every build):
- Artifact name: `verum-omnis-debug`
- File: `app-debug.apk`
- Use for: Development and testing
- Retention: 30 days

**Release APK** (main branch only):
- Artifact name: `verum-omnis-release`
- File: `app-release.apk`
- Use for: Production distribution
- Retention: 90 days
- Also available in GitHub Releases

---

## Next Steps After Setup

Once your signed APK is building successfully:

1. **Test the APK**: Install on test devices to verify functionality
2. **Performance Testing**: Test with real data and multiple users
3. **Security Review**: Consider third-party security audit
4. **Legal Review**: Ensure compliance with data protection laws
5. **User Documentation**: Create installation and usage guides
6. **Support Plan**: Set up support channels for users
7. **Monitoring**: Set up crash reporting (e.g., Firebase Crashlytics)
8. **Analytics**: Add usage analytics if needed (with user consent)

---

## Additional Resources

### Official Documentation
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Play Console](https://play.google.com/console)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)

### Project Documentation
- `SIGNING_SETUP.md` - Detailed signing configuration
- `ANDROID_BUILD.md` - Android build instructions
- `PRODUCTION_READINESS.md` - Full production assessment
- `.github/workflows/android-build.yml` - Workflow configuration

### Support
- File issues: https://github.com/Liamhigh/legal-forensic-ai-as/issues
- Review workflow runs: https://github.com/Liamhigh/legal-forensic-ai-as/actions

---

## Summary

✅ Your GitHub Actions workflow is **already production-ready**

✅ It builds **signed APKs automatically**

✅ It verifies **APK signatures**

✅ It creates **GitHub Releases**

**All you need to do**: Configure the 4 GitHub secrets (Step 3), and you'll have production-ready signed APKs building automatically on every push to `main`.

**Questions?** Check the troubleshooting section or open a GitHub issue.
