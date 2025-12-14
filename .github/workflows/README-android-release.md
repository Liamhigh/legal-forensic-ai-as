# Build & Sign Release APK Workflow

This workflow (`android-release.yml`) builds and signs production-ready Android APKs for the Verum Omnis Legal Forensics application.

## Overview

The `android-release.yml` workflow is optimized specifically for creating official release builds. Unlike the continuous integration workflow (`android-build.yml`), this workflow:

- **Only builds signed release APKs** (no debug builds)
- **Requires signing secrets** to be configured
- **Automatically creates GitHub Releases** when triggered by version tags
- **Best suited for production deployments** and Play Store submissions

## Triggers

This workflow runs in two scenarios:

### 1. Manual Trigger (Workflow Dispatch)
You can manually trigger the workflow from the GitHub Actions UI:
1. Go to the "Actions" tab in your repository
2. Select "Build & Sign Release APK" from the workflow list
3. Click "Run workflow"
4. Select the branch you want to build from
5. Click the green "Run workflow" button

### 2. Version Tag Push
The workflow automatically runs when you push a version tag:
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

Version tags must match the pattern `v*.*.*` (e.g., `v1.0.0`, `v2.1.3`, `v1.0.0-beta`)

**When triggered by a tag**: The workflow will automatically create a GitHub Release with the signed APK attached.

## Required Secrets

Before using this workflow, you **must** configure the following repository secrets in GitHub (Settings → Secrets → Actions):

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `KEYSTORE_BASE64` | Your Android keystore file encoded in base64 | `cat my-keystore.jks | base64 | tr -d '\n'` |
| `KEYSTORE_PASSWORD` | Password for the keystore file | The password you set when creating the keystore |
| `KEY_ALIAS` | Alias of the key within the keystore | The alias you used when creating the key |
| `KEY_PASSWORD` | Password for the specific key | The key password (often same as keystore password) |

### Creating a Keystore (First Time)

If you don't have a keystore yet:

```bash
keytool -genkey -v -keystore verum-omnis.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias verum-omnis-key
```

Follow the prompts to set passwords and enter your organization information.

**⚠️ IMPORTANT**: Store your keystore and passwords securely! If you lose them, you won't be able to update your app on the Play Store.

For detailed instructions, see [SIGNING_SETUP.md](../../SIGNING_SETUP.md).

## Workflow Steps

The workflow performs the following steps:

1. **Checkout repository** - Gets the latest code
2. **Set up Node.js** - Installs Node.js 18 for web builds
3. **Install dependencies** - Runs `npm ci` to install packages
4. **Build web application** - Runs `npm run build` to build the React app
5. **Set up JDK 17** - Installs Java Development Kit for Android builds
6. **Cache Gradle** - Caches Gradle dependencies for faster builds
7. **Set up Android SDK** - Installs Android SDK components
8. **Sync Capacitor** - Syncs web assets to Android project (`npx cap sync android`)
9. **Make gradlew executable** - Ensures Gradle wrapper is executable
10. **Decode keystore** - Decodes base64 keystore from secrets
11. **Build signed release APK** - Runs Gradle with signing parameters
12. **Upload APK artifact** - Uploads the signed APK to GitHub (available for 90 days)
13. **Create GitHub Release** (tag triggers only) - Creates a release with the APK

## Outputs

### Artifacts

After the workflow completes, you can download the signed APK:

1. Go to the workflow run page
2. Scroll to "Artifacts" section
3. Download `signed-release-apk`

The artifact is retained for **90 days**.

### GitHub Releases (Tag Triggers Only)

When triggered by a version tag (e.g., `v1.0.0`), the workflow automatically:
- Creates a GitHub Release with the same tag name
- Attaches the signed APK to the release
- Makes it available on your repository's Releases page

## Usage Examples

### Example 1: Manual Release Build

Use this when you want to build a signed APK without creating a tag:

1. Go to Actions → "Build & Sign Release APK"
2. Click "Run workflow"
3. Select your branch (e.g., `main`)
4. Click "Run workflow"
5. Wait for completion (typically 5-10 minutes)
6. Download the APK from artifacts

**Use case**: Testing the release build before making an official release

### Example 2: Official Release with Tag

Use this when you're ready to create an official versioned release:

```bash
# Make sure your code is committed and pushed
git add .
git commit -m "Prepare for v1.0.0 release"
git push origin main

# Create and push the version tag
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:
1. Build and sign the APK
2. Create a GitHub Release
3. Attach the APK to the release

**Use case**: Official releases for distribution or Play Store submission

### Example 3: Pre-release / Beta

For beta or pre-release versions:

```bash
git tag v1.0.0-beta1
git push origin v1.0.0-beta1
```

This follows the same process but you can mark it as a pre-release in GitHub.

## Troubleshooting

### "No secret KEYSTORE_BASE64 found"

**Problem**: The workflow fails because secrets aren't configured.

**Solution**: Add all four required secrets to your repository (see "Required Secrets" section above).

### "Keystore was tampered with, or password was incorrect"

**Problem**: The keystore password secret is incorrect.

**Solution**: 
1. Verify your `KEYSTORE_PASSWORD` secret matches the password you used when creating the keystore
2. Re-encode your keystore to ensure it's not corrupted: `cat my-keystore.jks | base64 | tr -d '\n'`

### "Key alias not found"

**Problem**: The `KEY_ALIAS` secret doesn't match an alias in your keystore.

**Solution**: 
1. List aliases in your keystore: `keytool -list -v -keystore my-keystore.jks`
2. Update the `KEY_ALIAS` secret to match the correct alias

### Build fails during Gradle step

**Problem**: Gradle build errors.

**Solution**:
1. Check the workflow logs for specific error messages
2. Ensure your Android project builds locally: `cd android && ./gradlew assembleRelease`
3. Verify all dependencies are correctly specified in `android/app/build.gradle`

### APK is unsigned after build

**Problem**: APK builds successfully but isn't signed.

**Solution**: Ensure all four secrets are properly configured and the keystore file is valid.

## Comparison with android-build.yml

| Feature | android-release.yml | android-build.yml |
|---------|---------------------|-------------------|
| **Purpose** | Production releases | Continuous integration |
| **Triggers** | Manual + version tags | Every push + PR |
| **Builds** | Release only | Debug + Release |
| **Signing** | Required | Optional (release only) |
| **GitHub Releases** | Yes (on tags) | Yes (on main push) |
| **Artifacts Retention** | 90 days | Debug: 30 days, Release: 90 days |
| **Best For** | Official releases, Play Store | Development, testing, CI |

## Security Notes

- **Never commit your keystore file** to the repository
- **Never commit passwords or secrets** to the repository
- **Store keystore securely** with backups in a safe location
- **Use GitHub Secrets** for all sensitive information
- **Limit who can trigger workflows** using GitHub repository permissions
- **Rotate keys periodically** for enhanced security (advanced users)

## Additional Resources

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Project Signing Setup Guide](../../SIGNING_SETUP.md)
- [Android Build Guide](../../ANDROID_BUILD.md)

## Next Steps

After setting up this workflow:

1. **Add secrets** to your repository (see "Required Secrets" section)
2. **Test the workflow** with a manual trigger first
3. **Create your first release** using a version tag
4. **Download the APK** and verify it's properly signed
5. **Distribute** via GitHub Releases or upload to Play Store

For Play Store submission, you may want to build an Android App Bundle (AAB) instead. Contact the maintainers if you need AAB build support.
