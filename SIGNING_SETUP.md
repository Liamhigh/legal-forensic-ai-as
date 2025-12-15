# Android APK Signing Setup

This document explains how to set up GitHub Actions to build and sign the Android APK automatically.

## Overview

The GitHub Actions workflow (`android-build.yml`) automatically builds:
- **Debug APK**: Built on every push and pull request
- **Signed Release APK**: Built on main branch with proper signing keys

## Setting Up Signing Keys

### 1. Generate a Keystore (First Time Only)

If you don't have a keystore yet, generate one:

```bash
keytool -genkey -v -keystore verum-omnis.jks -keyalg RSA -keysize 2048 -validity 10000 -alias verum-omnis-key
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (remember this!)
- Your name and organization details

**IMPORTANT**: Keep your keystore file safe and backed up. If you lose it, you cannot update your app on Google Play Store.

### 2. Encode Keystore to Base64

Convert your keystore to base64 format:

```bash
base64 -i verum-omnis.jks -o keystore.txt
```

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("verum-omnis.jks")) | Out-File keystore.txt
```

### 3. Add Secrets to GitHub (REQUIRED)

Go to your repository on GitHub:
1. Navigate to Settings > Secrets and variables > Actions
2. Add the following secrets:

| Secret Name | Value | Description | Required |
|------------|-------|-------------|----------|
| `KEYSTORE_BASE64` | Content of `keystore.txt` | Base64 encoded keystore file | ✅ YES |
| `KEYSTORE_PASSWORD` | Your keystore password | Password used to create keystore | ✅ YES |
| `KEY_ALIAS` | `verum-omnis-key` | Alias used when creating keystore | ✅ YES |
| `KEY_PASSWORD` | Your key password | Password for the key alias | ✅ YES |

**IMPORTANT**: All four secrets are required for signed builds. If any are missing, the build will fail with a clear error message.

### 4. Test the Workflow

Once secrets are configured:
1. Push to the `main` branch or trigger workflow manually
2. GitHub Actions will build and sign the APK
3. **Automatic verification**: APK signature is verified with `apksigner`
4. Download the signed APK from the Actions artifacts

## Workflow Behavior

The GitHub Actions workflow automatically detects whether signing secrets are configured and builds the appropriate APK type.

**CRITICAL**: The workflow now enforces cryptographic verification. A "green check" only means the APK is properly signed.

### Debug Build
- **Triggers**: All pushes and pull requests
- **Output**: `verum-omnis-debug.apk`
- **Signing**: Debug keystore (automatic)
- **Use**: Testing and development

### Release Build
- **Triggers**: Pushes to `main` branch or manual dispatch
- **Output**: `verum-omnis-release.apk`
- **Signing**: 
  - **Signed APK**: Built when `KEYSTORE_BASE64` and related secrets are configured
    - ✅ APK signature verified with `apksigner verify` in CI
    - ✅ Build fails if signing credentials are incomplete
    - ✅ Certificate details logged for audit trail
  - **Unsigned APK**: Built when secrets are not configured (for testing workflow only)
- **Use**: Distribution and Play Store uploads (signed APK only)

### Signature Verification (Automated)

The workflow automatically verifies every signed release APK using:

```bash
apksigner verify --print-certs app-release.apk
```

This ensures:
- APK is cryptographically signed
- No silent fallback to unsigned builds
- Certificate information is visible in CI logs

## Verifying Signed APK

The CI automatically verifies APK signatures, but you can also verify locally:

```bash
# Check APK signature (recommended method)
apksigner verify --print-certs app-release.apk

# Alternative: using jarsigner
jarsigner -verify -verbose -certs app-release.apk

# View signing certificate
keytool -printcert -jarfile app-release.apk
```

## Building Locally with Signing

To build a signed release locally:

```bash
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/path/to/verum-omnis.jks \
  -Pandroid.injected.signing.store.password=YOUR_KEYSTORE_PASSWORD \
  -Pandroid.injected.signing.key.alias=verum-omnis-key \
  -Pandroid.injected.signing.key.password=YOUR_KEY_PASSWORD
```

The `android/app/build.gradle` file is already configured to use these injected signing properties automatically when provided.

## Security Best Practices

1. **Never commit keystore files** - They're already in `.gitignore`
2. **Never commit passwords** - Use GitHub Secrets
3. **Backup your keystore** - Store it securely offline
4. **Use strong passwords** - At least 12 characters
5. **Rotate keys periodically** - For enhanced security

## Troubleshooting

### "Keystore was tampered with, or password was incorrect"
- Double-check your `KEYSTORE_PASSWORD` secret
- Verify the base64 encoding is correct

### "Could not find key alias"
- Verify `KEY_ALIAS` matches the alias used when creating keystore
- List aliases: `keytool -list -v -keystore verum-omnis.jks`

### "APK not signed"
- Check that all four secrets are properly configured
- Review GitHub Actions logs for error messages

## Automatic Releases

When a signed APK is built on the main branch:
- A GitHub Release is automatically created
- The APK is attached to the release
- Release is tagged with version number

## Google Play Store Upload

To upload to Play Store:
1. Download the signed release APK from GitHub Actions
2. Or build an Android App Bundle (AAB):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
3. Upload to Google Play Console
4. Follow Play Store review process

## Additional Resources

- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Play Console](https://play.google.com/console)
