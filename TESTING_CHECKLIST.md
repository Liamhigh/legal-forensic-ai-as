# Testing Checklist for Verum Omnis Legal Forensics Application

This document provides a comprehensive testing checklist to ensure all features work correctly.

## Build System Tests

### Web Build Tests
- [x] **npm install** - Installs all dependencies without errors
- [x] **npm run build** - Builds production web assets successfully
- [x] **npm run lint** - Runs ESLint with only warnings (no errors)
- [x] **npx tsc --noEmit** - TypeScript compilation passes without errors
- [x] **npm run android:build** - Builds web assets and syncs to Android

### Android Build Tests
- [x] **Capacitor Sync** - Successfully syncs web assets to Android
- [x] **Plugin Detection** - Detects @capacitor/filesystem and @capacitor/geolocation plugins
- [ ] **Gradle Build** - Android Studio or gradlew builds APK (requires network access)
- [ ] **APK Generation** - Debug and release APKs generate successfully

### CI/CD Tests
- [x] **GitHub Actions Workflow** - Syntax is correct with proper secret conditionals
- [ ] **Workflow Execution** - Workflow runs successfully on push to main
- [ ] **Signed APK** - Release job generates signed APK when secrets are configured
- [ ] **Unsigned APK** - Release job generates unsigned APK when secrets are not configured

## Application Feature Tests

### 1. Document Upload and Sealing
**Location**: `src/components/DocumentUpload.tsx`, `src/services/documentSealing.ts`

Test Cases:
- [ ] Upload a .txt file - Should seal successfully with SHA-256 hash
- [ ] Upload a .pdf file - Should seal successfully
- [ ] Upload a .docx file - Should seal successfully
- [ ] View seal information after upload
- [ ] Download sealed document with seal data embedded
- [ ] Upload previously sealed document - Should verify existing seal, not re-seal
- [ ] Test geolocation capture during sealing (if permissions granted)

**Expected Behavior**:
- Document is cryptographically sealed with SHA-256 hash
- Seal includes timestamp, location (if available), and jurisdiction
- Previously sealed documents are verified, not re-sealed
- Seal information is displayed to user
- Sealed document can be downloaded

### 2. Constitutional Enforcement Layer
**Location**: `src/services/constitutionalEnforcement.ts`

Test Cases:
- [ ] Upload personal document as public user - Should allow
- [ ] Upload business document as public user - Should deny and lock session
- [ ] Test authenticity verification on suspicious documents
- [ ] Test session lock on constitutional violation
- [ ] Verify refusal report generation on denial

**Expected Behavior**:
- Public users can only seal personal documents
- Business/corporate documents require institutional authentication
- Fabricated or suspicious documents are rejected
- Session locks on violations
- Sealed refusal report is generated on denial

### 3. PDF Viewer
**Location**: `src/components/PDFViewer.tsx`

Test Cases:
- [ ] View Master Forensic Archive PDF on load
- [ ] Navigate through PDF pages
- [ ] PDF displays correctly in mobile view
- [ ] PDF is accessible from Android app assets

**Expected Behavior**:
- Master Forensic Archive PDF loads on application start
- PDF viewer is responsive and functional
- PDF is properly synced to Android assets

### 4. Report Generation
**Location**: `src/components/ReportGenerator.tsx`, `src/services/pdfReportGenerator.ts`

Test Cases:
- [ ] Generate report without password protection - Full content visible
- [ ] Generate report with password protection - Content obfuscated
- [ ] Generate report with watermark option enabled
- [ ] View watermark image in new tab
- [ ] Verify report includes unique ID (VOR-{timestamp}-{random})
- [ ] Verify report includes document hash
- [ ] Verify report includes seal information
- [ ] Download generated report

**Expected Behavior**:
- Reports generate with unique IDs
- Password protection obfuscates content (demonstration mode)
- Watermark reference is included when enabled
- Report includes all forensic metadata
- Report hash is calculated and included
- Downloaded as .txt file

### 5. AI Forensic Analysis Chat
**Location**: `src/App.tsx`

Test Cases:
- [ ] Send forensic analysis query
- [ ] Receive AI response with forensic language
- [ ] Verify response includes disclaimers
- [ ] Test suggested prompts functionality
- [ ] Verify session lock check before sending
- [ ] Test conversation history persistence
- [ ] Clear conversation history

**Expected Behavior**:
- AI responds with forensic analysis using proper legal language
- Constitutional enforcement rules are applied to responses
- Disclaimers are included in responses
- Locked sessions prevent message sending
- Conversation persists across page refreshes (KV storage)

### 6. Session Management
**Location**: `src/components/SessionStatus.tsx`, `src/services/authContext.ts`

Test Cases:
- [ ] View session status display
- [ ] Public session is initialized on load
- [ ] Test institutional login (if credentials available)
- [ ] Test session logout
- [ ] Verify session lock on constitutional violation
- [ ] Refresh page to reset locked session

**Expected Behavior**:
- Session status is clearly displayed
- Public session starts automatically
- Institutional authentication works when credentials provided
- Session locks when constitutional violations occur
- Locked sessions can be reset by page refresh

### 7. Geolocation Integration
**Location**: `src/services/documentSealing.ts`, Android: `geo/GeoForensics.java`

Test Cases:
- [ ] Request location permission on first use
- [ ] Capture GPS coordinates during sealing
- [ ] Capture WiFi SSID when available
- [ ] Capture cell tower information when available
- [ ] Handle location permission denial gracefully
- [ ] Web fallback geolocation works

**Expected Behavior**:
- Location permission is requested appropriately
- GPS coordinates captured with accuracy
- Additional context (WiFi, cell) captured when available
- Graceful degradation when permissions denied
- Location data included in seal information

### 8. Native Android Email Forensics
**Location**: Android Java files in `com.verumomnis.forensics`

Test Cases:
- [ ] Open ForensicActivity from plugin
- [ ] Select .eml or .msg file
- [ ] Email is parsed and analyzed
- [ ] Email attachments are extracted
- [ ] Email bundle is sealed with SHA-512
- [ ] Sealed bundle can be shared
- [ ] Build case file from multiple sealed emails
- [ ] Verify audit log is maintained

**Expected Behavior**:
- ForensicActivity launches successfully
- Email files are parsed using mime4j
- Contradictions are detected (time gaps, missing headers)
- Attachments extracted to bundle
- Bundle sealed with SHA-512 and blockchain timestamp
- Case files can be built from multiple sealed items
- All operations logged to audit log

## Security Tests

### Cryptographic Sealing
- [x] SHA-256 hashing works correctly
- [ ] Seals are reproducible for same content
- [ ] Seal verification works for previously sealed documents
- [ ] Blockchain transaction IDs are generated

### Input Validation
- [x] Filename sanitization prevents path traversal
- [ ] File size limits are enforced
- [ ] Content type validation works
- [ ] SQL injection attempts are blocked (N/A - no database)
- [ ] XSS attempts are sanitized

### Permission Handling
- [ ] Location permissions requested appropriately
- [ ] Storage permissions requested appropriately
- [ ] Permission denials handled gracefully
- [ ] No sensitive data exposed in logs

## Documentation Tests

### Build Instructions Accuracy
- [x] GEMINI_INSTRUCTIONS.md - SDK versions match actual code (35/35/23)
- [x] GEMINI_INSTRUCTIONS.md - npm commands are correct
- [x] ANDROID_BUILD.md - Build commands are accurate
- [ ] README.md - Installation steps work correctly
- [ ] All documentation files are consistent with each other

### Code Comments
- [ ] Critical functions have clear comments
- [ ] Java code has Javadoc where appropriate
- [ ] TypeScript code has JSDoc where helpful
- [ ] Complex logic is explained

## Performance Tests

### Web Application
- [ ] Initial load time is acceptable (< 3 seconds)
- [ ] Document sealing completes in reasonable time (< 5 seconds)
- [ ] PDF viewer loads smoothly
- [ ] No memory leaks in long-running sessions

### Android Application
- [ ] APK size is reasonable (< 50MB)
- [ ] App launches quickly (< 2 seconds)
- [ ] Native operations are performant
- [ ] Battery usage is acceptable

## Integration Tests

### Capacitor Integration
- [x] Capacitor plugins are registered correctly
- [x] Web assets sync to Android properly
- [ ] Native calls from web work correctly
- [ ] Plugin permissions are handled properly

### API Integration
- [ ] Spark LLM integration works
- [ ] LLM responses are properly formatted
- [ ] Error handling for API failures works
- [ ] Rate limiting is handled gracefully

## Regression Tests

### After Code Changes
- [x] Build still works after linting fixes
- [x] TypeScript compilation still passes
- [x] No new security vulnerabilities introduced (CodeQL verified)
- [ ] Existing features still work correctly
- [ ] No performance degradation

## Test Results Summary

### Passed ✅
- Web build system (npm build, lint, TypeScript)
- Capacitor sync to Android
- ESLint configuration
- GitHub Actions workflow syntax
- CodeQL security scan (0 vulnerabilities)
- SDK version documentation accuracy

### Not Tested (Network/Environment Limitations) ⚠️
- Gradle build (requires network access to Google Maven)
- Android Studio APK generation
- GitHub Actions workflow execution
- Native Android runtime tests

### Manual Testing Required 📋
- All application features (document upload, sealing, etc.)
- User interface and user experience
- Mobile device testing
- Location permission flows
- Email forensics native features

## Recommendations

1. **Automated Testing**: Consider adding Jest/Vitest unit tests for critical functions
2. **E2E Testing**: Add Playwright tests for complete user flows
3. **CI Testing**: Test workflow execution in actual CI environment
4. **Device Testing**: Test on physical Android devices with various OS versions
5. **Performance Monitoring**: Add performance metrics tracking
6. **Error Tracking**: Implement error tracking service (e.g., Sentry)

## Conclusion

The application code is well-structured with:
- ✅ Clean builds
- ✅ No TypeScript errors
- ✅ Minimal linting warnings
- ✅ No security vulnerabilities
- ✅ Proper Capacitor integration
- ✅ Accurate build documentation

The codebase is ready for manual testing and deployment. Manual testing of all features is recommended before production use.
