# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

---

## 📱 Android App

This project now includes a native Android application built with Capacitor!

### Building the Android App

The Verum Omnis application can be built as a native Android app that includes:
- Full AI-powered legal forensics interface
- Integrated Master Forensic Archive PDF (v5.2.7)
- **Company Branding**: Dual logo display with professional styling
- **Watermarked Reports**: Forensic reports with watermark indicators
- **Password Protection**: Optional password-protected report generation
- **Cryptographic Document Sealing**: SHA-256 hash sealing for all uploads/downloads
- **Geolocation Support**: Jurisdiction detection and timestamp accuracy
- **Constitutional Enforcement Layer**: Standing detection, honesty enforcement, and shutdown logic
- **Automated Builds**: GitHub Actions workflow for signed APK releases
- Native Android performance
- Offline capabilities

## 🛡️ Constitutional Enforcement Layer

This application enforces constitutional forensic standards through multiple layers:

### 1. Universal Sealing (Already Implemented)
- **Every upload** is cryptographically sealed with SHA-256 hash
- **Every output** is cryptographically sealed and immutable
- Sealing applies even when processing is denied
- No preview modes, soft scans, or unsecured paths

### 2. Context & Standing Detection
Documents are automatically classified before analysis:
- **PERSONAL_SELF_MATTER**: Personal communications and documents where user is the originator or victim
- **BUSINESS_OR_CORPORATE_MATTER**: Corporate documents, contracts, business records
- **MULTI_PARTY_CASE_FILE**: Legal case files with multiple parties
- **UNKNOWN_OR_AMBIGUOUS**: Unclear classification

### 3. Standing Rules (Hard Stops)
- **Public users** may ONLY process:
  - Their own communications
  - Their own documents
  - Matters where they are the clear originator or victim
- **Business/Corporate matters** require authenticated institutional access
- **Multi-party case files** require authenticated institutional access
- **No overrides or "continue anyway"** options

### 4. Honesty & Authenticity Enforcement
All uploads are verified for:
- Metadata consistency
- Structural integrity
- Timeline coherence
- Contradiction detection
- Known forgery indicators

If material falsehood, fabrication, or manipulation is detected:
- Processing is **immediately terminated**
- Findings are **sealed**
- Session is **locked**
- A sealed integrity failure report is generated

### 5. Constitutional Shutdown Logic
The system **will not assist** with:
- Standing violations (unauthorized access to business/multi-party documents)
- Dishonest submissions (fabricated or manipulated evidence)
- Deliberate misrepresentation
- Malicious reuse attempts

When violations are detected:
- All materials are sealed
- Session is terminated
- Sealed explanation is provided (non-accusatory, factual)

### 6. Forensic Language Enforcement
All AI-generated analysis adheres to:
- Evidentiary analysis only (not legal determinations)
- Never assigns guilt or recommends prosecution
- Neutral, objective forensic tone
- Clear distinction between facts, inferences, and speculation
- Required disclaimers on all substantive responses

### 7. Authentication Scope
- **Public access**: Personal matters only
- **Institutional access**: Corporate and multi-party documents allowed
- **All users** subject to authenticity checks and shutdown rules
- **No privileged bypass** - institutions are still subject to enforcement

### Quick Start

```bash
# Verify Android Studio readiness (NEW!)
./verify-android-studio-ready.sh

# Check if ready for Android Studio (comprehensive check)
./preflight-check.sh

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Build and sync to Android
npm run android:build

# Open in Android Studio (will auto-build)
npm run android:open
```

### Android Studio Auto-Build

This project is configured to **automatically build** when opened in Android Studio:

1. **Open Project**: File → Open → Select the `android` folder
2. **Auto-Sync**: Android Studio automatically syncs Gradle (5-10 min first time)
3. **Auto-Build**: Project builds automatically after sync completes
4. **Ready to Run**: Click the Run button to install on device/emulator

**Optimized for speed**: Gradle daemon, parallel builds, and configuration caching enabled.

For detailed Android build instructions, see [ANDROID_BUILD.md](./ANDROID_BUILD.md).

For logo and watermark integration details, see [LOGO_WATERMARK_INTEGRATION.md](./LOGO_WATERMARK_INTEGRATION.md).

For signing and automated builds setup, see [SIGNING_SETUP.md](./SIGNING_SETUP.md).

