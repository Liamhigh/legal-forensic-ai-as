# Email Forensics Implementation

This implementation adds comprehensive email forensics capabilities to the Verum Omnis Android application, as specified in the provided PDF documentation.

## Features Implemented

### 1. Email Sealing
- **File Format Support**: .eml, .msg, and raw MIME emails
- **Geolocation Stamping**: GPS + Wi-Fi + Cell Tower + Timestamp
- **Cryptographic Sealing**: SHA-512 hash + Device HMAC + Blockchain timestamp
- **Forensic Analysis**: 
  - Contradiction detection (sent/received time gaps)
  - Header validation (Message-ID verification)
  - Metadata drift analysis
  - Timeline reconstruction

### 2. Core Components

#### Security Layer (`com.verumomnis.forensics.security`)
- **SealGate.java**: Provides SHA-512 hash sealing and blockchain timestamp simulation
  - `sealIn()`: Seals any file with cryptographic hash
  - Returns `SealedBlob` with hash and blockchain transaction ID

#### Geolocation Layer (`com.verumomnis.forensics.geo`)
- **GeoForensics.java**: Captures comprehensive location data
  - GPS coordinates with accuracy
  - Wi-Fi SSID and BSSID
  - Cell tower information
  - UTC timestamp
  - Generates SHA-512 hash of all location data

#### Core Utilities (`com.verumomnis.forensics.core`)
- **AuditLogger.java**: Forensic audit trail logging
  - All operations logged with timestamps
  - Cryptographic hashes recorded
  - Persistent log file storage

- **CaseFileManager.java**: Final case file assembly
  - Collects all sealed email bundles
  - Aggregates forensic reports
  - Creates manifest with narrative
  - Super-seals final ZIP for court submission

#### Email Processing (`com.verumomnis.forensics.email`)
- **EmailIntake.java**: Complete email forensics pipeline
  - Parses MIME/EML messages using JavaMail
  - Extracts headers, metadata, and attachments
  - Analyzes for contradictions and anomalies
  - Bundles with geolocation and analysis
  - Creates sealed ZIP archive

### 3. User Interface

#### ForensicActivity
Native Android activity providing:
- **"Seal E-mail" button**: Opens file picker for .eml/.msg files
- **"Build Final Case File" button**: Aggregates all sealed evidence
- Real-time status updates
- Automatic sharing of sealed bundles
- Display of cryptographic hashes and blockchain transaction IDs

#### Capacitor Integration
- **EmailForensicsPlugin**: Allows web UI to launch native forensic activity
- Registered in MainActivity for seamless integration

## Usage

### From Native UI
1. Launch the ForensicActivity
2. Tap "Seal E-mail (.eml / .msg)"
3. Select an email file using the Android file picker
4. Email is automatically:
   - Geolocation-stamped
   - Analyzed for anomalies
   - Sealed with SHA-512 hash
   - Blockchain-timestamped
   - Bundled as ZIP
5. Share the sealed bundle

### From Web UI (Capacitor)
```javascript
import { Plugins } from '@capacitor/core';
const { EmailForensics } = Plugins;

// Launch native email forensics activity
await EmailForensics.openEmailSealer();
```

### Building Final Case File
1. After sealing multiple emails/evidence
2. Tap "Build Final Case File"
3. System collects:
   - All `email_bundle_*.zip` files
   - All `VO_Forensic_Report_*.pdf` files
4. Creates manifest with:
   - Case metadata
   - Evidence inventory
   - Narrative text
5. Super-seals as final ZIP
6. Ready for court submission

## Technical Details

### Dependencies Added
```gradle
implementation 'org.apache.james:apache-mime4j-core:0.8.9'
implementation 'org.apache.james:apache-mime4j-dom:0.8.9'
implementation 'com.sun.mail:android-mail:1.6.7'
implementation 'com.sun.mail:android-activation:1.6.7'
```

### Permissions Added
- `ACCESS_WIFI_STATE`: Wi-Fi network information capture
- `GET_ACCOUNTS`: Device account context (optional)
- `READ_EXTERNAL_STORAGE`: Email file access

### File Structure
```
email_bundle_<timestamp>.zip
├── original.eml          # Raw email file
├── analysis.json         # Forensic analysis results
└── attachments/          # Extracted attachments
    ├── attachment1.pdf
    └── attachment2.jpg
```

### Final Case File Structure
```
CaseFile_<name>_<timestamp>.zip
├── manifest_<timestamp>.txt  # Case manifest and narrative
├── email_bundle_1.zip       # Sealed email evidence
├── email_bundle_2.zip       # Sealed email evidence
└── VO_Forensic_Report_1.pdf # Sealed forensic reports
```

## Security Features

1. **Cryptographic Integrity**: SHA-512 hashing ensures tampering detection
2. **Geolocation Anchoring**: Evidence tied to specific location and time
3. **Blockchain Timestamp**: Immutable proof of existence (simulation for now)
4. **Audit Trail**: All operations logged with cryptographic proof
5. **Chain of Custody**: Multi-layer sealing preserves evidence integrity

## Court-Ready Output

Every sealed bundle includes:
- Original email in unmodified form
- Complete header analysis
- Contradiction detection report
- Geolocation proof
- SHA-512 cryptographic hash
- Blockchain transaction reference
- Timestamp with millisecond precision

The final case file is:
- Self-contained and portable
- Cryptographically sealed
- Court-admissible format
- Complete chain of custody documentation

## Notes

- The blockchain integration currently generates mock transaction IDs
- In production, integrate with actual blockchain (Ethereum/Polygon)
- Geolocation requires appropriate device permissions
- Email parsing supports standard MIME/RFC822 formats
- All sealed files are automatically included in case file builds
