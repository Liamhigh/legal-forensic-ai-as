# Production APK Signing - Quick Setup Checklist

## ✅ Prerequisites Completed

Your repository already has:
- ✅ GitHub Actions workflow configured (`.github/workflows/android-build.yml`)
- ✅ Android signing configuration in `build.gradle`
- ✅ Automatic APK signature verification
- ✅ Automatic GitHub Releases
- ✅ Security guards and CI validation

**Status**: Ready for production signing - just needs keystore configuration.

---

## 🔐 Required Actions (Repository Owner: @Liamhigh)

### Step 1: Generate Keystore (One-Time)

```bash
keytool -genkey -v -keystore verum-omnis-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias verum-omnis-key
```

**Record these:**
- [ ] Keystore password: ______________________
- [ ] Key password: ______________________
- [ ] Key alias: verum-omnis-key (default)

**⚠️ Store keystore file securely** - backup in multiple encrypted locations!

---

### Step 2: Encode Keystore

**macOS/Linux:**
```bash
base64 -i verum-omnis-release.jks -o keystore.txt
```

**Windows:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("verum-omnis-release.jks")) | Out-File keystore.txt
```

---

### Step 3: Configure GitHub Secrets

Navigate to: https://github.com/Liamhigh/legal-forensic-ai-as/settings/secrets/actions

Add these 4 secrets:

- [ ] `KEYSTORE_BASE64` - Full content of `keystore.txt`
- [ ] `KEYSTORE_PASSWORD` - Your keystore password
- [ ] `KEY_ALIAS` - `verum-omnis-key` (or your custom alias)
- [ ] `KEY_PASSWORD` - Your key password

**⚠️ All 4 secrets are required for signed builds.**

---

### Step 4: Trigger Build

**Option A - Push to main:**
```bash
git push origin main
```

**Option B - Manual workflow:**
1. Go to: https://github.com/Liamhigh/legal-forensic-ai-as/actions
2. Click "Build Android APK"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"

---

### Step 5: Verify & Download

**Check workflow:**
- [ ] Go to Actions tab
- [ ] Verify build succeeded (green checkmark)
- [ ] Verify "APK signature verified successfully" in logs

**Download APK:**
- [ ] From workflow artifacts: Download "verum-omnis-release"
- [ ] Or from Releases: https://github.com/Liamhigh/legal-forensic-ai-as/releases

**Test APK:**
- [ ] Install on test device
- [ ] Verify app launches and works correctly
- [ ] Verify no signature warnings

---

## 🚀 Distribution Options

### Option A: Direct Distribution (Immediate)
- [ ] Upload APK to your server/portal
- [ ] Share with authorized users
- [ ] Provide installation instructions

### Option B: Google Play Store (Recommended)
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Create app listing with screenshots/descriptions
- [ ] Upload signed APK or AAB
- [ ] Complete content rating questionnaire
- [ ] Submit for review (1-7 days)

### Option C: Private Beta (Testing)
- [ ] Upload to Internal Testing track in Play Console
- [ ] Add tester email addresses
- [ ] Collect feedback before public release

---

## 📋 Post-Setup Actions

After first successful signed build:

- [ ] Test APK on multiple Android devices
- [ ] Verify all app features work correctly
- [ ] Set up crash reporting (e.g., Firebase Crashlytics)
- [ ] Create user documentation
- [ ] Set up support channels
- [ ] Consider security audit
- [ ] Review privacy/legal compliance

---

## 🆘 Quick Troubleshooting

### Build fails with "Signing secrets are required"
→ One or more of the 4 GitHub secrets is missing or misspelled

### "Keystore was tampered with, or password was incorrect"
→ `KEYSTORE_PASSWORD` secret doesn't match actual password

### "Could not find key alias"
→ `KEY_ALIAS` secret doesn't match keystore alias
→ Check with: `keytool -list -v -keystore verum-omnis-release.jks`

### APK built but signature verification fails
→ `KEYSTORE_BASE64` may be incomplete or corrupted
→ Re-generate base64 encoding and update secret

---

## 📚 Detailed Documentation

For complete instructions and troubleshooting:
- `PRODUCTION_DEPLOYMENT.md` - Full production deployment guide
- `SIGNING_SETUP.md` - Detailed signing configuration
- `ANDROID_BUILD.md` - Android build instructions

---

## ✅ Summary

**Current Status**: Production-ready workflow is configured and waiting for signing credentials.

**What You Need**: Configure 4 GitHub secrets (Step 3 above).

**Time Required**: ~15 minutes for keystore setup and secret configuration.

**Result**: Automatic signed APK builds on every push to `main` + automatic GitHub Releases.

---

## 🔒 Security Reminders

- ❌ Never commit keystore files to repository
- ❌ Never share keystore passwords in plain text
- ❌ Never lose your keystore (cannot recover)
- ✅ Store keystore in encrypted backup (1Password, LastPass, etc.)
- ✅ Keep multiple backups in different locations
- ✅ Use strong passwords (12+ characters)
- ✅ Limit access to authorized team members only

---

**Need Help?** 
- Open an issue: https://github.com/Liamhigh/legal-forensic-ai-as/issues
- Review workflow: https://github.com/Liamhigh/legal-forensic-ai-as/actions
