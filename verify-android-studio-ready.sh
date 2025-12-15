#!/bin/bash
# Android Studio Readiness Verification Script
# This script checks if the Android project is properly configured for Android Studio

set -e

echo "=========================================="
echo "Android Studio Readiness Check"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_GOOD=true

# Check 1: Android directory exists
echo -n "✓ Checking android directory... "
if [ -d "android" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: android directory not found"
    ALL_GOOD=false
fi

# Check 2: Gradle wrapper exists
echo -n "✓ Checking Gradle wrapper... "
if [ -f "android/gradlew" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: gradlew not found"
    ALL_GOOD=false
fi

# Check 3: settings.gradle exists
echo -n "✓ Checking settings.gradle... "
if [ -f "android/settings.gradle" ]; then
    # Check if pluginManagement is at the top
    FIRST_BLOCK=$(grep -A 1 "^[^#/]" android/settings.gradle | head -1 | grep -c "pluginManagement" || true)
    if [ "$FIRST_BLOCK" -eq 1 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}WARNING${NC}"
        echo "  WARNING: pluginManagement block may not be at the top"
    fi
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: settings.gradle not found"
    ALL_GOOD=false
fi

# Check 4: build.gradle exists
echo -n "✓ Checking build.gradle files... "
if [ -f "android/build.gradle" ] && [ -f "android/app/build.gradle" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: build.gradle files missing"
    ALL_GOOD=false
fi

# Check 5: .idea directory with essential files
echo -n "✓ Checking .idea configuration... "
IDEA_FILES_PRESENT=true
if [ ! -f "android/.idea/compiler.xml" ]; then
    IDEA_FILES_PRESENT=false
fi
if [ ! -f "android/.idea/misc.xml" ]; then
    IDEA_FILES_PRESENT=false
fi
if [ ! -f "android/.idea/vcs.xml" ]; then
    IDEA_FILES_PRESENT=false
fi

if [ "$IDEA_FILES_PRESENT" = true ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  WARNING: Some .idea configuration files are missing"
    echo "  Android Studio will regenerate them, but initial setup may take longer"
fi

# Check 6: .gitattributes exists
echo -n "✓ Checking .gitattributes... "
if [ -f "android/.gitattributes" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  WARNING: .gitattributes not found"
    echo "  This may cause line ending issues on Windows"
fi

# Check 7: AndroidManifest.xml exists
echo -n "✓ Checking AndroidManifest.xml... "
if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: AndroidManifest.xml not found"
    ALL_GOOD=false
fi

# Check 8: gradle.properties exists
echo -n "✓ Checking gradle.properties... "
if [ -f "android/gradle.properties" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: gradle.properties not found"
    ALL_GOOD=false
fi

# Check 9: Java/Kotlin source files
echo -n "✓ Checking source files... "
JAVA_COUNT=$(find android/app/src/main/java -name "*.java" 2>/dev/null | wc -l || echo "0")
if [ "$JAVA_COUNT" -gt 0 ]; then
    echo -e "${GREEN}OK${NC} ($JAVA_COUNT Java files found)"
else
    echo -e "${YELLOW}WARNING${NC}"
    echo "  WARNING: No Java source files found"
fi

# Check 10: Gradle version compatibility
echo -n "✓ Checking Gradle version... "
if [ -f "android/gradle/wrapper/gradle-wrapper.properties" ]; then
    GRADLE_VERSION=$(grep "distributionUrl" android/gradle/wrapper/gradle-wrapper.properties | grep -oP 'gradle-\K[0-9.]+' || echo "unknown")
    if [[ "$GRADLE_VERSION" =~ ^8\. ]]; then
        echo -e "${GREEN}OK${NC} (v$GRADLE_VERSION)"
    else
        echo -e "${YELLOW}WARNING${NC}"
        echo "  WARNING: Gradle version $GRADLE_VERSION may have compatibility issues"
        echo "  Recommended: Gradle 8.x"
    fi
else
    echo -e "${RED}FAILED${NC}"
    echo "  ERROR: gradle-wrapper.properties not found"
    ALL_GOOD=false
fi

echo ""
echo "=========================================="

# Final summary
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your Android project is ready for Android Studio!"
    echo ""
    echo "Next steps:"
    echo "1. Open Android Studio"
    echo "2. File → Open → Select the 'android' folder"
    echo "3. Wait for Gradle sync to complete"
    echo "4. Click Run to build and launch the app"
    echo ""
    echo "For detailed instructions, see:"
    echo "  - android/OPEN_IN_ANDROID_STUDIO.md"
    echo "  - ANDROID_STUDIO_QUICKSTART.md"
    echo "  - ANDROID_STUDIO_SETUP.md"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please review the errors above and fix them before opening in Android Studio."
    echo ""
    echo "For help, see:"
    echo "  - ANDROID_STUDIO_SETUP.md"
    echo "  - ANDROID_BUILD.md"
    exit 1
fi
