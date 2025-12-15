# Verum Omnis Forensic Engine v5.2.7

**Constitutional Implementation of the Verum Omnis Forensic Standard**

This repository implements the complete Verum Omnis Forensic Standard v5.2.7 as specified in the constitutional PDF: *Verum Omnis Master Forensic Archive v5.2.7 (Institutional Edition)*.

## 🏛️ Constitutional Compliance

This implementation strictly adheres to all 12 constitutional requirements:

1. ✅ **Version & Identity**: Hard-set to v5.2.7, included in all reports
2. ✅ **Forensic Hashing**: SHA-512 ONLY for evidence, dual hashing (Public SHA-512 + Device HMAC-SHA512)
3. ✅ **PDF Output Format**: PDF/A-3B with embedded XMP metadata, no HTML/text/previews
4. ✅ **Deterministic Analysis**: Same input → identical output, rule-based engine
5. ✅ **Jurisdiction Awareness**: Explicit selection required (UAE, South Africa, EU)
6. ✅ **Blockchain Anchoring**: Honest state (OFFLINE_PENDING), no faking
7. ✅ **Stateless Operation**: Client-side only, secure deletion, no telemetry
8. ✅ **Audit Logging**: Append-only, SHA-256 hashed, embedded in reports
9. ✅ **User Experience**: SAF picker, jurisdiction selector, progress states
10. ✅ **Failure Behavior**: Forensic refusal reports, no silent failures
11. ✅ **License Awareness**: Apache 2.0 (PDFBox), no AGPL, no telemetry
12. ✅ **Final Rule**: PDF standard ALWAYS WINS in any conflict

**Security Status:**
- ✅ **CodeQL Scan: PASSED** (0 vulnerabilities)
- ✅ **Code Review: COMPLETED** (all issues addressed)
- ✅ PBKDF2 key derivation for HMAC keys (10,000 iterations)
- ✅ Secure file deletion (3-pass overwrite with random data)
- ✅ No server storage, no network calls, no tracking

## 📱 Android Application

Native Android forensic evidence processing application with:

### Core Features
- **Forensic Email Sealing**: Process .eml/.msg files with full chain-of-custody
- **Dual Cryptographic Hashing**: 
  - Public SHA-512 (reproducible, court-verifiable)
  - Device HMAC-SHA512 (device-bound, chain-of-custody)
- **PDF Report Generation**: PDF/A-3B compliant with embedded metadata
- **Jurisdiction Selection**: UAE, South Africa, EU (extensible)
- **Deterministic Analysis**: Same input always produces identical output
- **Blockchain Anchoring**: Honest state reporting (OFFLINE_PENDING)
- **Audit Trail**: Append-only logs with SHA-256 verification
- **Secure Deletion**: 3-pass overwrite of temporary files

### Constitutional Enforcement
- **No jurisdiction = No analysis** (hard stop)
- Forensic refusal reports on constitutional violations
- Progress state display: Securing → Analyzing → Sealing → Anchoring
- Version v5.2.7 displayed in all reports and UI

### Architecture

```
android/app/src/main/java/com/verumomnis/forensics/
├── core/
│   ├── ForensicVersion.java          # Version constants (v5.2.7)
│   ├── JurisdictionManager.java      # Jurisdiction loading & validation
│   ├── AuditLogger.java              # Append-only audit logging
│   └── CaseFileManager.java          # Case file bundling
├── security/
│   ├── SealGate.java                 # SHA-512 + HMAC-SHA512 sealing
│   └── SecureFileUtils.java          # Secure file deletion
├── pdf/
│   └── ForensicReportGenerator.java  # PDF/A-3B generation
├── analysis/
│   └── DeterministicAnalysisEngine.java  # Rule-based deterministic analysis
├── email/
│   └── EmailIntake.java              # Email forensic processing
├── geo/
│   └── GeoForensics.java             # Location verification
└── ForensicActivity.java             # Main UI with jurisdiction selector
```

### Jurisdiction Data

JSON-based jurisdiction configuration:
```
res/raw/
├── jurisdiction_uae.json             # UAE legal framework
├── jurisdiction_south_africa.json    # South Africa legal framework
└── jurisdiction_eu.json              # EU legal framework
```

Each jurisdiction includes:
- Legal system description
- Authorities (legal references)
- Evidence standards
- Data retention requirements
- Hash algorithm requirements (SHA-512)

## 🚀 Quick Start

### Prerequisites
- Android Studio (latest version)
- JDK 17 or higher
- Android SDK API 34+
- Node.js 18+ (for web interface)

### Installation

```bash
# Clone repository
git clone https://github.com/Liamhigh/legal-forensic-ai-as.git
cd legal-forensic-ai-as

# Install dependencies
npm install

# Build web interface
npm run build

# Sync to Android
npm run android:build

# Open in Android Studio
npm run android:open
```

### Android Studio

1. Open Android Studio
2. File → Open → Select `android` folder
3. Wait for Gradle sync (5-10 minutes first time)
4. Click Run to build and install on device/emulator

## 📚 Documentation

- **[VERUM_OMNIS_V5.2.7_IMPLEMENTATION.md](./VERUM_OMNIS_V5.2.7_IMPLEMENTATION.md)** - Complete implementation guide
- **[ANDROID_BUILD.md](./ANDROID_BUILD.md)** - Android build instructions
- **[CONSTITUTIONAL_ENFORCEMENT.md](./CONSTITUTIONAL_ENFORCEMENT.md)** - Enforcement layer details
- **[SECURITY.md](./SECURITY.md)** - Security policies

## 🔒 Security

### Cryptographic Standards
- **Evidence Hashing**: SHA-512 (128-bit security)
- **Chain-of-Custody**: HMAC-SHA512 with PBKDF2 key derivation
- **Audit Logs**: SHA-256 (sufficient for auxiliary hashing)
- **Model Hashing**: SHA-256 (for deterministic analysis engine)

### Data Protection
- Secure file deletion (3-pass overwrite)
- Force sync to disk (fsync)
- No recoverable data after deletion
- Local-only storage
- No telemetry or tracking
- No server communication

### Compliance
- **CodeQL Security Scan**: ✅ PASSED (0 vulnerabilities)
- **Code Review**: ✅ COMPLETED
- No AGPL dependencies
- Apache 2.0 licensed (PDFBox)

## 📜 License

This project uses:
- **PDFBox Android**: Apache License 2.0
- **Other dependencies**: Compatible open-source licenses

See individual dependency licenses for details.

## 🛡️ Constitutional Authority

This implementation is governed by:
**Verum Omnis Master Forensic Archive v5.2.7 (Institutional Edition)**

In any conflict between convenience, performance, or existing code patterns, the PDF standard ALWAYS WINS.

## 🤝 Contributing

This is a constitutional implementation. Changes must:
1. Maintain strict compliance with v5.2.7 standard
2. Pass CodeQL security scan
3. Include appropriate documentation
4. Not introduce telemetry, tracking, or server dependencies
5. Maintain deterministic behavior

## 📞 Support

For issues related to:
- **Constitutional compliance**: See VERUM_OMNIS_V5.2.7_IMPLEMENTATION.md
- **Android build**: See ANDROID_BUILD.md
- **Security**: See SECURITY.md

---

**Implementation Date:** December 15, 2024  
**Engine Version:** v5.2.7  
**Security Status:** ✅ PASSED (CodeQL: 0 vulnerabilities)  
**Constitutional Authority:** Verum Omnis Master Forensic Archive v5.2.7
