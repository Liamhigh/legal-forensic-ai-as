#!/bin/bash
# Gradle Wrapper Validation and Setup Script
# This script ensures Gradle wrapper is properly configured for automatic builds

set -e

echo "🔍 Checking Gradle Wrapper Configuration..."

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo "❌ Error: gradlew not found!"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew
echo "✅ gradlew is executable"

# Check if gradle wrapper jar exists
if [ ! -f "./gradle/wrapper/gradle-wrapper.jar" ]; then
    echo "❌ Error: gradle-wrapper.jar not found!"
    exit 1
fi
echo "✅ gradle-wrapper.jar exists"

# Check if gradle wrapper properties exists
if [ ! -f "./gradle/wrapper/gradle-wrapper.properties" ]; then
    echo "❌ Error: gradle-wrapper.properties not found!"
    exit 1
fi
echo "✅ gradle-wrapper.properties exists"

# Check Gradle version
echo ""
echo "📦 Gradle Version:"
./gradlew --version | grep "Gradle " || true

# Check if local.properties exists
if [ -f "./local.properties" ]; then
    echo ""
    echo "✅ local.properties exists"
    echo "   SDK path configured:"
    grep "sdk.dir" local.properties | sed 's/^/   /'
else
    echo ""
    echo "⚠️  local.properties not found"
    echo "   Android Studio will create this automatically when you open the project"
    echo "   Or you can create it from local.properties.template"
fi

echo ""
echo "✅ Gradle wrapper is properly configured!"
echo "   You can now open this project in Android Studio"
echo "   Android Studio will automatically:"
echo "   - Sync Gradle dependencies"
echo "   - Download required libraries"
echo "   - Build the project"
echo ""
