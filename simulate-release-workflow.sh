#!/bin/bash
# GitHub Actions Release Workflow Local Simulator
# This script simulates the build-release job from .github/workflows/android-build.yml
# to verify that the release workflow would succeed in CI before pushing changes.

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track issues found
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to print section headers
print_section() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "🚀 GitHub Actions Release Workflow Simulation"
echo "=============================================="
echo ""
echo "This script simulates the build-release job from:"
echo "  .github/workflows/android-build.yml"
echo ""
echo "It will verify:"
echo "  1. CI Guards (security checks)"
echo "  2. Node.js build"
echo "  3. Capacitor sync (file modification check)"
echo "  4. Gradle assembleRelease with signing"
echo "  5. APK signature verification"
echo ""

# Store starting directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ========================================
# STEP 1: CI Guard Checks
# ========================================
print_section "STEP 1: CI Guard - Security Checks"

# Check for masked placeholders
print_info "Checking for masked signing placeholders in workflow..."
if grep -q '\*\*\*\*\*\*' .github/workflows/android-build.yml; then
    print_error "Masked signing placeholder (******) detected in android-build.yml"
    echo "   This indicates a potential security regression where secrets were committed."
else
    print_success "No masked placeholders found in workflow"
fi

# Check for SHA-256 signing references
print_info "Checking for SHA-256 signing references in workflow..."
if grep -iE 'sha-?256.*sign' .github/workflows/android-build.yml; then
    print_error "SHA-256 signing detected in android-build.yml"
    echo "   APK signing must rely on keystore only, not SHA-256 hash signing."
else
    print_success "No SHA-256 signing references found"
fi

# ========================================
# STEP 2: Node.js Environment Check
# ========================================
print_section "STEP 2: Node.js Environment"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
    
    # Verify it's Node 18+ (as required by workflow)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js version is 18 or higher"
    else
        print_warning "Node.js version is below 18 (workflow uses 18)"
        echo "   CI uses Node 18, local is using $NODE_VERSION"
    fi
else
    print_error "Node.js not found!"
    echo "   The workflow requires Node.js 18"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found!"
fi

# ========================================
# STEP 3: Install Dependencies
# ========================================
print_section "STEP 3: Install Dependencies (npm ci)"

print_info "Running: npm ci"
if npm ci; then
    print_success "Dependencies installed successfully"
else
    print_error "npm ci failed"
    echo "   This would cause CI to fail at the 'Install dependencies' step"
fi

# ========================================
# STEP 4: Build Web Application
# ========================================
print_section "STEP 4: Build Web Application (npm run build)"

print_info "Running: npm run build"
if npm run build; then
    print_success "Web application built successfully"
    
    # Verify dist directory exists
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_success "dist directory created (size: $DIST_SIZE)"
    else
        print_error "dist directory not created after build"
    fi
else
    print_error "npm run build failed"
    echo "   This would cause CI to fail at the 'Build web application' step"
fi

# ========================================
# STEP 5: Java/JDK Environment Check
# ========================================
print_section "STEP 5: Java/JDK Environment"

# Check Java version
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_success "Java installed: $JAVA_VERSION"
    
    # Extract major version
    # Handles multiple formats:
    # - Modern: "17.0.17" or "11.0.12"
    # - Legacy: "1.8.0_292" (Java 8)
    # - OpenJDK: "openjdk version "17.0.17" 2025-10-21"
    if echo "$JAVA_VERSION" | grep -q "version"; then
        # Extract the version number from quotes (e.g., "17.0.17" -> 17)
        JAVA_MAJOR=$(echo "$JAVA_VERSION" | sed -n 's/.*version "\([0-9]*\)\..*/\1/p' | head -1)
        # Handle older Java versions like "1.8.0" -> 8
        if [ "$JAVA_MAJOR" = "1" ]; then
            JAVA_MAJOR=$(echo "$JAVA_VERSION" | sed -n 's/.*version "1\.\([0-9]*\).*/\1/p' | head -1)
        fi
        # Verify we got a valid number before comparison
        if [ -n "$JAVA_MAJOR" ] && [ "$JAVA_MAJOR" -ge 17 ] 2>/dev/null; then
            print_success "Java version is 17 or higher"
        elif [ -n "$JAVA_MAJOR" ]; then
            print_warning "Java version is below 17 (workflow uses 17)"
            echo "   CI uses JDK 17, local is using Java $JAVA_MAJOR"
        else
            print_warning "Could not parse Java version"
        fi
    fi
else
    print_error "Java not found!"
    echo "   The workflow requires JDK 17"
fi

# ========================================
# STEP 6: Capacitor Sync with Modification Check
# ========================================
print_section "STEP 6: Capacitor Sync (npx cap sync android)"

# Create a snapshot of tracked files before sync
print_info "Creating snapshot of tracked files before sync..."
TRACKED_FILES_BEFORE=$(mktemp)
git ls-files > "$TRACKED_FILES_BEFORE"

# Store git status before sync
print_info "Checking git status before sync..."
git status --porcelain > /tmp/git-status-before-sync.txt
if [ -s /tmp/git-status-before-sync.txt ]; then
    print_warning "Working directory has uncommitted changes before sync:"
    cat /tmp/git-status-before-sync.txt | head -10
fi

print_info "Running: npx cap sync android"
if npx cap sync android; then
    print_success "Capacitor sync completed"
    
    # Check if sync modified any tracked files
    print_info "Checking for modifications to tracked files..."
    git status --porcelain > /tmp/git-status-after-sync.txt
    
    if [ -s /tmp/git-status-after-sync.txt ]; then
        # Check if the changes are to tracked files
        MODIFIED_TRACKED=false
        while IFS= read -r line; do
            # Extract filename (handle various git status formats)
            file=$(echo "$line" | awk '{print $NF}')
            # Check if this file is tracked
            if grep -q "^$file$" "$TRACKED_FILES_BEFORE"; then
                MODIFIED_TRACKED=true
                break
            fi
        done < /tmp/git-status-after-sync.txt
        
        if [ "$MODIFIED_TRACKED" = true ]; then
            print_error "Capacitor sync modified tracked files"
            echo "   This could cause CI to fail if the workflow expects no modifications"
            echo ""
            echo "   Modified tracked files:"
            git diff --name-only | head -10
            echo ""
            echo "   💡 POTENTIAL CI DIVERGENCE:"
            echo "   If these modifications happen in CI but are not committed,"
            echo "   subsequent builds may fail or produce different artifacts."
        else
            print_success "Capacitor sync did not modify tracked files"
            print_info "Untracked files may have been created (this is normal)"
        fi
    else
        print_success "Capacitor sync did not modify any files"
    fi
else
    print_error "Capacitor sync failed"
    echo "   This would cause CI to fail at the 'Sync Capacitor' step"
fi

rm -f "$TRACKED_FILES_BEFORE"

# ========================================
# STEP 7: Android Environment Check
# ========================================
print_section "STEP 7: Android Environment"

# Check for ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    # Try to find Android SDK
    if [ -f "android/local.properties" ]; then
        SDK_DIR=$(grep "sdk.dir" android/local.properties | cut -d'=' -f2 | tr -d '\r')
        if [ -n "$SDK_DIR" ]; then
            print_info "Found Android SDK in local.properties: $SDK_DIR"
            export ANDROID_HOME="$SDK_DIR"
            export ANDROID_SDK_ROOT="$SDK_DIR"
        else
            print_warning "ANDROID_HOME not set and sdk.dir not found in local.properties"
            echo "   CI uses android-actions/setup-android@v3 to set this up"
        fi
    else
        print_warning "ANDROID_HOME not set and local.properties not found"
        echo "   CI uses android-actions/setup-android@v3 to set this up"
    fi
else
    print_success "ANDROID_HOME set: $ANDROID_HOME"
fi

# Check gradlew
if [ -f "android/gradlew" ]; then
    print_success "Gradle wrapper (gradlew) exists"
    chmod +x android/gradlew
    print_success "gradlew is executable"
else
    print_error "Gradle wrapper (gradlew) not found"
fi

# ========================================
# STEP 8: Signing Configuration Check
# ========================================
print_section "STEP 8: Signing Configuration Analysis"

print_info "Analyzing signing configuration..."
echo ""

# Check for keystore in secrets (simulated)
KEYSTORE_BASE64="${KEYSTORE_BASE64:-}"
KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-}"
KEY_ALIAS="${KEY_ALIAS:-}"
KEY_PASSWORD="${KEY_PASSWORD:-}"

if [ -z "$KEYSTORE_BASE64" ]; then
    print_warning "KEYSTORE_BASE64 environment variable not set"
    echo "   In CI, this comes from: secrets.KEYSTORE_BASE64"
    echo ""
    echo "   📋 FAILURE PATH WITHOUT SECRETS:"
    echo "   1. Keystore decode step will be SKIPPED (if condition false)"
    echo "   2. Signed release APK build step will be SKIPPED (if condition false)"
    echo "   3. APK signature verification step will be SKIPPED (if condition false)"
    echo "   4. UNSIGNED release APK build step will RUN instead"
    echo "   5. The workflow will complete but produce an UNSIGNED APK"
    echo ""
    echo "   ⚠️  CRITICAL: The unsigned APK CANNOT be installed on production devices"
    echo "   ⚠️  The unsigned APK CANNOT be published to Google Play Store"
    echo ""
    
    # Try to find keystore locally
    if [ -f "android/app/keystore.jks" ]; then
        print_info "Found keystore file locally: android/app/keystore.jks"
        print_warning "This file should NOT be committed (it's in .gitignore)"
        echo "   We'll attempt to use it for local simulation..."
        KEYSTORE_FILE="app/keystore.jks"
        
        # Check for local signing.properties (common practice)
        if [ -f "android/signing.properties" ]; then
            print_info "Found android/signing.properties"
            echo "   Attempting to load signing credentials..."
            # Safely parse properties file (avoid executing arbitrary code)
            while IFS='=' read -r key value; do
                # Skip comments and empty lines
                [[ "$key" =~ ^[[:space:]]*# ]] && continue
                [[ -z "$key" ]] && continue
                # Remove leading/trailing whitespace
                key=$(echo "$key" | xargs)
                value=$(echo "$value" | xargs)
                # Export known safe variables only
                case "$key" in
                    KEYSTORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)
                        export "$key=$value"
                        ;;
                esac
            done < android/signing.properties
        fi
    else
        print_info "No local keystore found at android/app/keystore.jks"
    fi
else
    print_success "KEYSTORE_BASE64 is set"
    print_info "Decoding keystore..."
    
    # Decode keystore (check for errors)
    if echo "$KEYSTORE_BASE64" | base64 -d > android/app/keystore.jks 2>/tmp/keystore-decode-error.txt; then
        if [ -s android/app/keystore.jks ]; then
            print_success "Keystore decoded successfully"
            KEYSTORE_FILE="app/keystore.jks"
        else
            print_error "Keystore decode produced empty file"
            echo "   This would cause signing to fail in CI"
            if [ -s /tmp/keystore-decode-error.txt ]; then
                echo "   Error: $(cat /tmp/keystore-decode-error.txt)"
            fi
        fi
    else
        print_error "Failed to decode keystore"
        echo "   This would cause signing to fail in CI"
        if [ -s /tmp/keystore-decode-error.txt ]; then
            echo "   Error: $(cat /tmp/keystore-decode-error.txt)"
        fi
    fi
    rm -f /tmp/keystore-decode-error.txt
fi

# Check other signing parameters
if [ -z "$KEYSTORE_PASSWORD" ]; then
    print_warning "KEYSTORE_PASSWORD not set (secrets.KEYSTORE_PASSWORD in CI)"
else
    print_success "KEYSTORE_PASSWORD is set"
fi

if [ -z "$KEY_ALIAS" ]; then
    print_warning "KEY_ALIAS not set (secrets.KEY_ALIAS in CI)"
else
    print_success "KEY_ALIAS is set"
fi

if [ -z "$KEY_PASSWORD" ]; then
    print_warning "KEY_PASSWORD not set (secrets.KEY_PASSWORD in CI)"
else
    print_success "KEY_PASSWORD is set"
fi

# ========================================
# STEP 9: Gradle assembleRelease
# ========================================
print_section "STEP 9: Gradle assembleRelease"

cd android

# Determine which build path to simulate
if [ -n "$KEYSTORE_FILE" ] && [ -n "$KEYSTORE_PASSWORD" ] && [ -n "$KEY_ALIAS" ] && [ -n "$KEY_PASSWORD" ]; then
    print_info "Simulating: Build SIGNED release APK"
    print_info "Running Gradle with signing parameters..."
    echo ""
    
    export REQUIRE_SIGNED_RELEASE="true"
    
    print_info "Command: ./gradlew assembleRelease \\"
    echo "  -Pandroid.injected.signing.store.file=$KEYSTORE_FILE \\"
    echo "  -Pandroid.injected.signing.store.password=*** \\"
    echo "  -Pandroid.injected.signing.key.alias=*** \\"
    echo "  -Pandroid.injected.signing.key.password=***"
    echo ""
    
    if ./gradlew assembleRelease \
        -Pandroid.injected.signing.store.file="$KEYSTORE_FILE" \
        -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
        -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
        -Pandroid.injected.signing.key.password="$KEY_PASSWORD"; then
        print_success "Gradle assembleRelease completed successfully"
    else
        print_error "Gradle assembleRelease failed"
        echo "   This would cause CI to fail at the 'Build signed release APK' step"
        echo ""
        echo "   Common failure reasons:"
        echo "   - Incorrect keystore password"
        echo "   - Incorrect key alias"
        echo "   - Incorrect key password"
        echo "   - Keystore file corrupted or wrong format"
        echo "   - Gradle configuration issues"
    fi
else
    print_info "Simulating: Build UNSIGNED release APK (no signing credentials)"
    print_info "Running: ./gradlew assembleRelease"
    echo ""
    
    if ./gradlew assembleRelease; then
        print_success "Gradle assembleRelease completed successfully (unsigned)"
        print_warning "APK is UNSIGNED - cannot be installed on production devices"
    else
        print_error "Gradle assembleRelease failed"
        echo "   This would cause CI to fail at the 'Build unsigned release APK' step"
    fi
fi

cd ..

# ========================================
# STEP 10: Verify Release APK Exists
# ========================================
print_section "STEP 10: Verify Release APK"

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
    print_success "Release APK exists: $APK_PATH"
    print_info "APK size: $APK_SIZE"
    
    # List all files in release directory
    echo ""
    print_info "Contents of release directory:"
    ls -lh android/app/build/outputs/apk/release/
else
    print_error "Release APK not found at $APK_PATH"
    echo "   This would cause CI to fail at the 'Verify release APK exists' step"
    echo ""
    echo "   Checking if release directory exists..."
    if [ -d "android/app/build/outputs/apk/release/" ]; then
        echo "   Release directory exists, listing contents:"
        ls -la android/app/build/outputs/apk/release/
    else
        echo "   Release directory does not exist"
    fi
fi

# ========================================
# STEP 11: APK Signature Verification
# ========================================
print_section "STEP 11: APK Signature Verification"

if [ -f "$APK_PATH" ]; then
    if [ -n "$KEYSTORE_FILE" ] && [ -n "$KEYSTORE_PASSWORD" ] && [ -n "$KEY_ALIAS" ] && [ -n "$KEY_PASSWORD" ]; then
        print_info "Attempting to verify APK signature..."
        
        # Find apksigner
        APKSIGNER=""
        
        if [ -n "$ANDROID_HOME" ]; then
            # Try to find apksigner in Android SDK
            APKSIGNER=$(find "$ANDROID_HOME/build-tools" -name apksigner 2>/dev/null | sort -V | tail -n 1)
        fi
        
        if [ -z "$APKSIGNER" ]; then
            # Try common locations with existence checks
            if [ -n "$HOME" ]; then
                for bt_dir in "$HOME/Android/Sdk/build-tools"/* "$HOME/Library/Android/sdk/build-tools"/*; do
                    # Check if directory exists and contains apksigner
                    if [ -d "$bt_dir" ] && [ -f "$bt_dir/apksigner" ]; then
                        APKSIGNER="$bt_dir/apksigner"
                        break
                    fi
                done
            fi
        fi
        
        if [ -n "$APKSIGNER" ] && [ -f "$APKSIGNER" ]; then
            print_success "Found apksigner: $APKSIGNER"
            echo ""
            print_info "Running: apksigner verify --print-certs $APK_PATH"
            echo ""
            
            if "$APKSIGNER" verify --print-certs "$APK_PATH"; then
                print_success "APK signature verification PASSED"
                echo ""
                echo "   ✅ The APK is properly signed"
                echo "   ✅ This APK can be installed on production devices"
                echo "   ✅ This APK can be published to Google Play Store"
            else
                print_error "APK signature verification FAILED"
                echo ""
                echo "   ❌ The APK signature is invalid or missing"
                echo "   ❌ This would cause CI to fail at the 'Verify APK signature' step"
                echo ""
                echo "   Common reasons:"
                echo "   - APK was not actually signed during build"
                echo "   - Signing configuration was incorrect"
                echo "   - Wrong keystore was used"
            fi
        else
            print_warning "apksigner not found"
            echo "   Cannot verify APK signature locally"
            echo "   In CI, apksigner is available via android-actions/setup-android@v3"
            echo ""
            echo "   📋 SIGNATURE VERIFICATION SIMULATION:"
            
            # Try to check if APK has signing info using zipinfo
            if command -v zipinfo &> /dev/null; then
                if zipinfo "$APK_PATH" | grep -q "META-INF/.*\\.RSA\|META-INF/.*\\.DSA\|META-INF/.*\\.EC"; then
                    print_info "APK contains signing certificates (META-INF/*.RSA/DSA/EC)"
                    echo "   The APK appears to be signed"
                else
                    print_warning "APK does not contain signing certificates"
                    echo "   The APK appears to be UNSIGNED"
                fi
            else
                print_info "Cannot determine if APK is signed (zipinfo not available)"
            fi
        fi
    else
        print_info "Skipping signature verification (no signing credentials)"
        echo "   In CI, this step would be SKIPPED (if condition false)"
        echo ""
        print_warning "APK is UNSIGNED"
        echo ""
        echo "   📋 UNSIGNED APK LIMITATIONS:"
        echo "   ❌ Cannot be installed on production devices (non-debug)"
        echo "   ❌ Cannot be published to Google Play Store"
        echo "   ❌ Will show 'App not installed' error on most devices"
        echo "   ✅ Can be installed on debug builds with 'adb install'"
    fi
else
    print_error "Cannot verify APK signature - APK file not found"
fi

# ========================================
# STEP 12: Build Information
# ========================================
print_section "STEP 12: Build Information"

cd android

print_info "Extracting build information..."
echo ""

# Application ID
APP_ID=$(grep -E '^[[:space:]]*applicationId[[:space:]]' app/build.gradle | awk '{print $2}' | tr -d '"' | head -1)
if [ -n "$APP_ID" ]; then
    echo "Application ID: $APP_ID"
else
    echo "Application ID: (not found)"
fi

# Version Name
VERSION_NAME=$(grep -E '^[[:space:]]*versionName[[:space:]]' app/build.gradle | awk '{print $2}' | tr -d '"' | head -1)
if [ -n "$VERSION_NAME" ]; then
    echo "Version Name: $VERSION_NAME"
else
    echo "Version Name: (not found)"
fi

# Version Code
VERSION_CODE=$(grep -E '^[[:space:]]*versionCode[[:space:]]' app/build.gradle | awk '{print $2}' | head -1)
if [ -n "$VERSION_CODE" ]; then
    echo "Version Code: $VERSION_CODE"
else
    echo "Version Code: (not found)"
fi

cd ..

# ========================================
# SUMMARY
# ========================================
print_section "SUMMARY"

echo ""
echo "📊 Simulation Results:"
echo ""

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "The release workflow should succeed in CI."
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS_FOUND warning(s) found${NC}"
    echo ""
    echo "The release workflow might succeed in CI, but there are differences"
    echo "between the local and CI environments that could cause divergence."
else
    echo -e "${RED}❌ $ISSUES_FOUND error(s) and $WARNINGS_FOUND warning(s) found${NC}"
    echo ""
    echo "The release workflow would likely FAIL in CI."
fi

echo ""
echo "📋 CI vs Local Divergence Analysis:"
echo ""

if [ -n "$KEYSTORE_BASE64" ]; then
    echo -e "${GREEN}✅ Signing credentials available (matching CI with secrets)${NC}"
else
    echo -e "${YELLOW}⚠️  No signing credentials (diverges from CI with secrets configured)${NC}"
fi

if [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
    echo -e "${GREEN}✅ Node.js version compatible with CI (18+)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js version differs from CI (local: $NODE_MAJOR, CI: 18)${NC}"
fi

if [ -n "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✅ Android SDK configured${NC}"
else
    echo -e "${YELLOW}⚠️  ANDROID_HOME not set (CI sets this automatically)${NC}"
fi

echo ""
echo "📝 Recommendations:"
echo ""

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "1. Fix all errors before pushing to trigger CI"
fi

if [ -z "$KEYSTORE_BASE64" ] && [ $ISSUES_FOUND -eq 0 ]; then
    echo "1. To fully simulate signed release builds, set these environment variables:"
    echo "   export KEYSTORE_BASE64='<base64-encoded-keystore>'"
    echo "   export KEYSTORE_PASSWORD='<your-keystore-password>'"
    echo "   export KEY_ALIAS='<your-key-alias>'"
    echo "   export KEY_PASSWORD='<your-key-password>'"
    echo ""
    echo "   Or create android/signing.properties with:"
    echo "   KEYSTORE_PASSWORD=your-password"
    echo "   KEY_ALIAS=your-alias"
    echo "   KEY_PASSWORD=your-password"
fi

if [ $WARNINGS_FOUND -gt 0 ]; then
    echo "2. Review warnings above for potential CI divergence"
fi

echo ""
echo "✅ Simulation complete!"
echo ""

# Exit with appropriate code
if [ $ISSUES_FOUND -gt 0 ]; then
    exit 1
else
    exit 0
fi
