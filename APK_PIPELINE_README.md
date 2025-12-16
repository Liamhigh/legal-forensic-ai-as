# Production-Grade APK Verification Pipeline

## Overview

This repository implements a production-grade GitHub Actions CI/CD pipeline that ensures Android APKs are only built and signed after passing all verification gates. This approach is suitable for regulated environments including law enforcement, legal forensics, and institutional use.

## Pipeline Architecture

The pipeline consists of three sequential jobs that must all succeed:

### 1. Verification Gates Job
Runs on both `push` and `pull_request` to `main` branch.

**Gates (executed in strict order):**

1. **Dependency Integrity** - `npm ci`
   - Validates package-lock.json integrity
   - Fails on any lockfile mismatch or install error

2. **Static Quality** - `npm run lint`
   - TypeScript strict mode checks
   - ESLint validation
   - Fails on linting errors (warnings are acceptable)

3. **Unit & Component Tests** - `npm test`
   - Runs Vitest test suite
   - No snapshot updates allowed
   - All tests must pass

4. **Build Verification** - `npm run build`
   - Ensures production bundle completes successfully
   - TypeScript compilation check

### 2. Security Gate Job
Runs after verification gates pass.

**Security Analysis:**
- CodeQL static security analysis
- Zero tolerance policy - any alert fails the build
- Scans JavaScript/TypeScript code for vulnerabilities

### 3. Build Signed APK Job
**ONLY runs when:**
- Event type is `push` (not `pull_request`)
- Target branch is `main`
- All verification gates passed
- Security gate passed

**Build Process:**
1. Validates signing secrets exist
2. Decodes signing keystore from GitHub Secrets
3. Builds signed release APK using Gradle
4. Cryptographically verifies APK signature
5. Generates build metadata (commit SHA, timestamp)
6. Uploads signed APK as artifact
7. Creates GitHub Release with verified APK

## Required GitHub Secrets

For production builds on `main` branch, configure these secrets:

- `ANDROID_KEYSTORE_BASE64` - Base64-encoded Android keystore file
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_ALIAS` - Key alias name
- `ANDROID_KEY_PASSWORD` - Key password

**Note:** If these secrets are not configured, the workflow will fail with clear instructions on `main` branch.

## Artifact Naming Convention

APK artifacts are named: `{app-name}-{commit-sha}-{timestamp}`

Example: `verum-omnis-a1b2c3d-20231216-143022`

This ensures:
- Unique identification of each build
- Traceability to exact commit
- Temporal ordering of builds

## Failure Guarantees

The pipeline guarantees:

✅ No APK is built if any gate fails  
✅ No APK is built if security analysis fails  
✅ No APK is uploaded if signing fails  
✅ No conditional shortcuts or `continue-on-error` flags  
✅ Deterministic, reproducible builds  

**The APK itself is cryptographic proof that the entire system passed verification.**

## Testing Infrastructure

The repository includes Vitest for testing:

- **Framework:** Vitest with jsdom environment
- **Location:** `src/test/`
- **Run tests:** `npm test`
- **Setup file:** `src/test/setup.ts`

## Local Development

### Install Dependencies
```bash
npm ci
```

### Run Verification Gates Locally
```bash
# Gate 1: Dependencies
npm ci

# Gate 2: Linting
npm run lint

# Gate 3: Tests
npm test

# Gate 4: Build
npm run build
```

### Build Android APK Locally
```bash
# Build web application
npm run build

# Sync Capacitor
npx cap sync android

# Build APK (requires Android Studio/SDK)
cd android
./gradlew assembleRelease
```

## CI/CD Guard Rails

The workflow includes CI guards to prevent security regressions:

1. **Masked Placeholder Check** - Detects if secrets were accidentally committed
2. **SHA-256 Signing Check** - Ensures keystore-only signing (no hash-based shortcuts)

## Why This Approach?

### For Regulated Environments
- **Auditability:** Every APK is traceable to exact code state
- **Trust:** APK signature proves all gates passed
- **Compliance:** Meets institutional security requirements
- **No Shortcuts:** Human judgment removed from pipeline

### For Legal/Forensic Use
- **Chain of Custody:** Clear build lineage
- **Evidence Integrity:** Cryptographic proof of verification
- **Court-Ready:** Deterministic, reproducible builds

## Architecture Decisions

1. **Separate Jobs with Dependencies** - Ensures strict ordering and fail-fast behavior
2. **No `continue-on-error`** - Any failure stops the pipeline immediately
3. **Explicit Step Names** - Clear audit trail in workflow logs
4. **CodeQL Integration** - Industry-standard security analysis
5. **Artifact Metadata** - Timestamp and commit SHA for traceability

## Workflow Triggers

- **Push to `main`** - Runs all gates + builds signed APK
- **Pull Request to `main`** - Runs verification gates + security analysis only (no APK)

This ensures:
- PRs are validated before merge
- APKs are only built from `main` branch
- No APKs in development branches

## Support

For signing setup instructions, see: [SIGNING_SETUP.md](SIGNING_SETUP.md)

For Android build configuration, see: [ANDROID_BUILD.md](ANDROID_BUILD.md)

For Android Studio setup, see: [ANDROID_STUDIO_SETUP.md](ANDROID_STUDIO_SETUP.md)
