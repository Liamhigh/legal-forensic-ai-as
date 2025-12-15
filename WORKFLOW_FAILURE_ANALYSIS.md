# GitHub Actions Release Workflow - Failure Analysis

This document provides explicit reasoning about failure paths in the release workflow, particularly when secrets are missing or misconfigured.

## ⚠️ CRITICAL CHANGE: Signed Builds Are Now REQUIRED

**As of the latest update, the release workflow REQUIRES signed APKs and will FAIL if signing credentials are not configured.**

There is no longer a fallback to unsigned builds. This ensures:
- ✅ Only production-ready APKs are built
- ✅ No accidental unsigned releases
- ✅ Clear failure when secrets are missing
- ✅ Consistent, secure build process

## Workflow File
`.github/workflows/android-build.yml` - `build-release` job

## Failure Scenarios

### Scenario 1: No Signing Secrets Configured ⚠️ CRITICAL

**Condition:** `secrets.KEYSTORE_BASE64` is empty or not set

**Workflow Behavior:**
```yaml
- name: Check signing credentials
  run: |
    if [ -z "${{ secrets.KEYSTORE_BASE64 }}" ]; then
      echo "❌ ERROR: Signing credentials not configured"
      exit 1  # ❌ WORKFLOW FAILS HERE
    fi
```

**Result:**
- Workflow FAILS ❌ at the "Check signing credentials" step
- Build stops immediately
- NO APK produced (signed or unsigned)
- No artifacts uploaded
- No release created
- Build status: FAILED

**⚠️ Critical Impact:**
1. **Workflow will not proceed** - Fails before build even starts
2. **CI clearly indicates missing credentials** - Not a silent failure
3. **Forces proper configuration** - Must set up secrets to release
4. **No accidental unsigned releases** - Prevents production deployment of unsigned APKs

**CI vs Local Divergence:**
- CI will fail immediately at credential check
- Local simulation will detect and report the same failure
- Both environments fail consistently

**How to Fix:**
Configure these GitHub repository secrets:
- `KEYSTORE_BASE64` - Base64-encoded keystore file
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias name
- `KEY_PASSWORD` - Key password

---

### Scenario 2: Keystore Secret Exists but Other Secrets Missing

**Condition:** 
- `secrets.KEYSTORE_BASE64` is set ✅
- `secrets.KEYSTORE_PASSWORD` is empty ❌
- OR `secrets.KEY_ALIAS` is empty ❌
- OR `secrets.KEY_PASSWORD` is empty ❌

**Workflow Behavior:**
```yaml
- name: Check signing credentials
  run: |
    if [ -z "${{ secrets.KEYSTORE_BASE64 }}" ]; then
      exit 1
    fi
    echo "✅ Signing credentials are configured"  # ✅ PASSES (only checks KEYSTORE_BASE64)

- name: Decode Keystore
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/keystore.jks  # ✅ SUCCEEDS
  
- name: Build signed release APK
  env:
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}  # Empty or wrong
    KEY_ALIAS: ${{ secrets.KEY_ALIAS }}                  # Empty or wrong
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}            # Empty or wrong
  run: ./gradlew assembleRelease ...  # ❌ FAILS
```

**Result:**
- Workflow FAILS ❌ at Gradle build step
- Gradle build fails with keystore error
- Error: "Keystore password incorrect" or "Key alias not found"
- No APK produced
- No release created

**Error Messages:**
```
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:packageRelease'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.Workers$ActionFacade
   > Keystore was tampered with, or password was incorrect
```

**CI vs Local Divergence:**
- CI will fail at Gradle build step
- Local simulation will fail at same step if credentials provided
- Local simulation will warn if credentials not provided

---

### Scenario 3: Incorrect Keystore Password

**Condition:**
- All secrets set ✅
- `secrets.KEYSTORE_PASSWORD` is wrong ❌

**Workflow Behavior:**
```bash
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=app/keystore.jks \
  -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \  # ❌ Wrong password
  -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
  -Pandroid.injected.signing.key.password=$KEY_PASSWORD
```

**Result:**
- Workflow FAILS ❌
- Gradle fails to open keystore
- Error: "Keystore was tampered with, or password was incorrect"

**Common Causes:**
1. Password contains special characters not properly escaped
2. Password was changed but secret not updated
3. Wrong keystore file uploaded (password doesn't match)
4. Extra whitespace in secret value

---

### Scenario 4: Incorrect Key Alias

**Condition:**
- Keystore password correct ✅
- `secrets.KEY_ALIAS` is wrong ❌

**Result:**
- Workflow FAILS ❌
- Gradle fails to find key in keystore
- Error: "Alias 'wrong-alias' does not exist"

---

### Scenario 5: Incorrect Key Password

**Condition:**
- Keystore password correct ✅
- Key alias correct ✅
- `secrets.KEY_PASSWORD` is wrong ❌

**Result:**
- Workflow FAILS ❌
- Gradle fails to unlock private key
- Error: "Cannot recover key"

---

### Scenario 6: Keystore File Corrupted

**Condition:**
- `secrets.KEYSTORE_BASE64` is corrupted or truncated ❌

**Workflow Behavior:**
```bash
echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/keystore.jks
# Produces corrupted or empty file
```

**Result:**
- Workflow FAILS ❌
- Gradle fails to read keystore
- Error: "Invalid keystore format"

**Common Causes:**
1. Base64 encoding was corrupted during copy/paste
2. Newlines or spaces added to encoded string
3. Partial keystore data in secret
4. Wrong file uploaded as keystore

---

### Scenario 7: APK Signing Succeeds but Verification Fails

**Condition:**
- Build completes ✅
- APK created ✅
- Signature verification fails ❌

**Workflow Behavior:**
```bash
$APKSIGNER verify --print-certs android/app/build/outputs/apk/release/app-release.apk
# Exit code 1
```

**Result:**
- Workflow FAILS ❌
- Error: "DOES NOT VERIFY"
- Build was successful but APK is invalid

**Common Causes:**
1. Signing config not actually applied (build.gradle issue)
2. APK was modified after signing
3. Multiple signatures conflict (shouldn't happen with clean build)
4. Gradle produced unsigned APK despite signing config

**This is why verification is CRITICAL** - it catches build configuration bugs!

---

### Scenario 8: Capacitor Sync Modifies Tracked Files

**Condition:**
- `npx cap sync android` modifies files that are tracked in git

**Workflow Behavior:**
```bash
npx cap sync android
# Modifies android/app/src/main/AndroidManifest.xml
# or android/app/src/main/res/values/strings.xml
# or other tracked files
```

**Result:**
- Workflow SUCCEEDS ✅
- But creates inconsistent state

**⚠️ Issues:**
1. **Next run may fail** - Modified files not committed
2. **Build reproducibility broken** - Different runs produce different results
3. **Merge conflicts** - Parallel PRs may conflict
4. **CI vs Local divergence** - Local has different files than CI

**Solution:**
- Commit the modified files
- Or update `.gitignore` if they shouldn't be tracked
- Or fix Capacitor config to not modify them

---

## CI vs Local Divergence Points

### Environment Differences

| Aspect | CI (GitHub Actions) | Local |
|--------|-------------------|-------|
| Node.js | 18 (guaranteed) | Whatever is installed |
| Java | 17 (guaranteed) | Whatever is installed |
| Android SDK | Auto-configured | Must be manually set |
| Secrets | From GitHub Secrets | From env vars or local files |
| Network | Unrestricted | May have firewalls/proxies |
| File System | Clean on each run | May have stale build artifacts |

### Potential Divergence Issues

1. **Different Node version**
   - May build successfully locally but fail in CI
   - Dependencies may resolve differently
   - Vite build may behave differently

2. **Different Java version**
   - Gradle may fail with bytecode compatibility issues
   - Android build tools may require specific Java version

3. **Stale build artifacts**
   - Local builds may use cached files
   - CI always starts clean
   - Can hide dependency issues

4. **Secrets vs Local Files**
   - CI uses GitHub Secrets (base64 encoded)
   - Local may use actual keystore files
   - Different error modes if misconfigured

5. **Capacitor sync differences**
   - Local may have modified files
   - CI always syncs to clean state
   - Can cause "it works on my machine" issues

---

## Detection Strategy

The `simulate-release-workflow.sh` script detects these issues:

1. **Security Guards** - Prevents signing regressions
2. **Version Checks** - Warns if Node/Java differ from CI
3. **Build Verification** - Runs actual build steps
4. **File Modification Detection** - Checks if cap sync changes tracked files
5. **Signing Analysis** - Explains what happens with/without secrets
6. **APK Verification** - Confirms signing actually worked

---

## Recommendations

### For Production Releases

1. **Always set up signing secrets** in GitHub repository
2. **Test locally first** with `simulate-release-workflow.sh`
3. **Verify the APK** is signed before distributing
4. **Monitor CI logs** for warnings about unsigned builds

### For Debug/Testing

1. **Unsigned builds are OK** for development
2. **Document clearly** when builds are unsigned
3. **Don't distribute** unsigned APKs to users

### For CI/CD Health

1. **Run simulation** before pushing
2. **Check for file modifications** after Capacitor sync
3. **Keep dependencies updated** but test thoroughly
4. **Match local environment** to CI as much as possible

---

## Quick Reference: Steps That Could Fail

| Step | Fails If | Error Message | Impact |
|------|----------|---------------|--------|
| CI Guards | Secrets leaked in workflow | "Masked signing placeholder detected" | Build blocked |
| npm ci | package-lock.json issues | "Cannot find module" | Build fails |
| npm run build | TypeScript errors | "TS2304: Cannot find name" | Build fails |
| cap sync android | Missing Capacitor deps | "Capacitor not found" | Build fails |
| gradlew assembleRelease | Wrong signing config | "Keystore password incorrect" | Build fails |
| apksigner verify | APK not signed | "DOES NOT VERIFY" | Build fails |
| Verify APK exists | Gradle failed silently | "APK not found" | Build fails |

---

## Testing Checklist

Before pushing changes that affect the release workflow:

- [ ] Run `./simulate-release-workflow.sh`
- [ ] Check for file modifications after Capacitor sync
- [ ] Verify Node.js version matches CI (18+)
- [ ] Verify Java version matches CI (17+)
- [ ] If testing signing locally, verify APK signature
- [ ] Check workflow file for masked placeholders
- [ ] Ensure .gitignore excludes build artifacts and keys
- [ ] Review any warnings about CI divergence

---

## Emergency: Unsigned APK in Production

If you accidentally release an unsigned APK:

1. **DO NOT DISTRIBUTE** - Users cannot install it
2. **Check GitHub Secrets** - Ensure KEYSTORE_BASE64 is set
3. **Re-run workflow** - Should produce signed APK
4. **Verify signature** - Before distribution
5. **Document incident** - Update procedures to prevent recurrence

---

## Related Documentation

- `WORKFLOW_SIMULATION_README.md` - Usage guide for simulation script
- `.github/workflows/android-build.yml` - Actual workflow definition
- `android/app/build.gradle` - Signing configuration
- `SIGNING_SETUP.md` - Guide to setting up signing keys
