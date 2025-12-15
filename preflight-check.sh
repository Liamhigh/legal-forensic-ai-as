#!/bin/bash
# Pre-flight check script for Android Studio
# Run this before opening the project in Android Studio to ensure everything is ready

echo "🚀 Verum Omnis - Android Studio Pre-flight Check"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Node.js and npm
echo "1️⃣  Checking Node.js and npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "   Install from: https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Node dependencies
echo "2️⃣  Checking Node dependencies..."
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ node_modules directory exists${NC}"
    else
        echo -e "${YELLOW}⚠️  node_modules not found. Run: npm install${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ package.json not found!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Web build
echo "3️⃣  Checking web build..."
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ dist directory exists (web app built)${NC}"
else
    echo -e "${YELLOW}⚠️  dist directory not found. Run: npm run build${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: Android directory
echo "4️⃣  Checking Android project..."
if [ -d "android" ]; then
    echo -e "${GREEN}✅ android directory exists${NC}"
    
    # Check Gradle wrapper
    if [ -f "android/gradlew" ] && [ -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
        echo -e "${GREEN}✅ Gradle wrapper configured${NC}"
    else
        echo -e "${RED}❌ Gradle wrapper missing!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check local.properties
    if [ -f "android/local.properties" ]; then
        echo -e "${GREEN}✅ local.properties exists${NC}"
        if grep -q "sdk.dir" android/local.properties; then
            SDK_PATH=$(grep "sdk.dir" android/local.properties | cut -d'=' -f2)
            echo "   SDK path: $SDK_PATH"
        fi
    else
        echo -e "${YELLOW}⚠️  local.properties not found${NC}"
        echo "   Android Studio will create this automatically"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ android directory not found!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Java/JDK
echo "5️⃣  Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✅ Java installed: $JAVA_VERSION${NC}"
    
    # Check Java version (need 11+)
    if command -v javac &> /dev/null; then
        echo -e "${GREEN}✅ JDK installed${NC}"
    else
        echo -e "${YELLOW}⚠️  JDK not found (javac missing)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ Java not found!${NC}"
    echo "   Install JDK 11 or higher"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 6: Android Studio
echo "6️⃣  Checking Android Studio..."
if [ -d "/Applications/Android Studio.app" ] || [ -d "$HOME/android-studio" ] || command -v studio &> /dev/null; then
    echo -e "${GREEN}✅ Android Studio appears to be installed${NC}"
else
    echo -e "${YELLOW}⚠️  Android Studio not detected in common locations${NC}"
    echo "   If you have Android Studio installed, you can ignore this warning"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Summary:"
echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 You're ready to open the project in Android Studio!"
    echo ""
    echo "Next steps:"
    echo "  1. Open Android Studio"
    echo "  2. File → Open → Select the 'android' folder"
    echo "  3. Wait for Gradle sync (first time: 5-10 minutes)"
    echo "  4. Click Run to build and install on device/emulator"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo ""
    echo "You can still open the project in Android Studio, but you may want to:"
    if [ ! -d "node_modules" ]; then
        echo "  - Run: npm install"
    fi
    if [ ! -d "dist" ]; then
        echo "  - Run: npm run build"
    fi
    echo ""
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Please fix the errors above before opening in Android Studio."
    echo ""
fi
