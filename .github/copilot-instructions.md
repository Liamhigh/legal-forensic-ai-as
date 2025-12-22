# Copilot Instructions for Verum Omnis Legal Forensic AI

## Project Overview

**Verum Omnis** is the world's first AI-powered legal forensics platform designed for legal professionals to analyze evidence, research case law, and construct compelling arguments through an intelligent conversational interface.

### Core Purpose
- Provide professional legal forensic analysis capabilities
- Ensure constitutional enforcement and authenticity verification
- Maintain cryptographic document sealing for all operations
- Support both web and native Android platforms

### Project Type
- **Frontend**: React + TypeScript + Vite
- **Mobile**: Capacitor for native Android builds
- **Complexity**: Light Application (conversational interface with persistent state)

## Technology Stack

### Web Application
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components with custom styling
- **State Management**: @github/spark hooks (useKV for persistence)
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Phosphor Icons (@phosphor-icons/react)
- **Animations**: Framer Motion
- **PDF Handling**: pdfjs-dist for viewing, jsPDF for generation

### Mobile Platform
- **Framework**: Capacitor 8.x
- **Target**: Android (API level 26+)
- **Build System**: Gradle 8.7.2
- **Java/Kotlin**: JDK 17+

### Key Dependencies
- `@github/spark` - GitHub Spark framework (>= 0.43.1 < 1)
- `@capacitor/android`, `@capacitor/core`, `@capacitor/filesystem`, `@capacitor/geolocation`
- UI: Radix UI suite, shadcn/ui patterns
- Forms: react-hook-form + zod validation
- Crypto: SHA-256 hashing for document sealing

## Project Structure

```
/
├── src/
│   ├── App.tsx                    # Main chat interface
│   ├── main.tsx                   # Application entry point
│   ├── components/
│   │   ├── ui/                    # Reusable UI components (buttons, inputs, etc.)
│   │   ├── DocumentUpload.tsx     # File upload with constitutional enforcement
│   │   ├── PDFViewer.tsx          # PDF document viewer
│   │   ├── ReportGenerator.tsx    # Forensic report generation
│   │   └── SessionStatus.tsx      # Auth status display
│   ├── services/
│   │   ├── constitutionalEnforcement.ts  # Core enforcement logic
│   │   ├── documentSealing.ts            # SHA-256 cryptographic sealing
│   │   ├── authContext.ts                # Session management
│   │   └── pdfReportGenerator.ts         # PDF report creation
│   └── hooks/                     # Custom React hooks
├── android/                       # Native Android project (Capacitor)
├── public/                        # Static assets (PDFs, images)
└── Documentation files            # Multiple .md files for guides
```

## Coding Standards

### TypeScript
- **Strict Mode**: Enable `strictNullChecks` in tsconfig
- **Type Safety**: Avoid `any` types; use `unknown` or proper types
- **Unused Vars**: Prefix unused parameters with `_` (e.g., `_event`)
- **Path Aliases**: Use `@/*` for imports from `src/` directory

### React Patterns
- **Functional Components**: Use function components with hooks
- **State Management**: Use `useKV` from @github/spark for persistent state
- **Refs**: Use `useRef` for DOM elements and mutable values
- **Effects**: Keep `useEffect` dependencies accurate and minimal

### Code Style
- **ESLint**: Follow the project's eslint.config.js rules
- **Formatting**: 2-space indentation, single quotes for strings
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Minimal comments unless explaining complex legal/crypto logic
- **File Organization**: Group imports (React, external libs, internal, types)

### Component Development
- **UI Components**: Leverage existing Radix UI and shadcn/ui patterns from `src/components/ui/`
- **Composition**: Build features by composing small, reusable components
- **Props**: Define clear TypeScript interfaces for component props
- **Error Boundaries**: Use ErrorFallback.tsx for graceful error handling

## Build & Development

### Web Development
```bash
# Install dependencies
npm install

# Development server (port 5000)
npm run dev

# Build production bundle
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Android Development

#### Prerequisites
- Android Studio (latest version)
- JDK 17 or higher
- Android SDK (API level 26+)
- Node.js 18+

#### Build Commands
```bash
# Build web and sync to Android
npm run android:build

# Open in Android Studio
npm run android:open

# Build and run on device/emulator
npm run android:run
```

#### Android Studio Setup
1. Create `android/local.properties` with SDK path:
   - Windows: `sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk`
   - Mac: `sdk.dir=/Users/YourUsername/Library/Android/sdk`
   - Linux: `sdk.dir=/home/YourUsername/Android/Sdk`
2. Open `android` folder in Android Studio
3. Let Gradle sync complete
4. Build from Build menu or run configuration

#### Common Android Issues
- **Gradle sync fails**: Check JDK version (must be 17+)
- **SDK not found**: Verify `local.properties` SDK path
- **Build errors**: Run `npm run build` before Android commands
- **Capacitor sync**: Always run `npx cap sync android` after web changes

## Testing

### Current State
- No formal test suite currently implemented
- Manual testing required for features
- Android builds tested via Android Studio or connected devices

### Testing Checklist When Making Changes
1. **Web**: Test in browser dev server (`npm run dev`)
2. **Build**: Ensure production build succeeds (`npm run build`)
3. **Lint**: Run ESLint to catch issues (`npm run lint`)
4. **Android**: Build and test on device/emulator if mobile-related
5. **UI**: Verify responsive design at different screen sizes
6. **State**: Test persistence by refreshing browser/restarting app

## Key Features & Requirements

### Constitutional Enforcement Layer
**Critical**: This is a core security feature that must not be bypassed or disabled.

#### Components
- **Standing Detection** (`constitutionalEnforcement.ts`):
  - Classifies documents: PERSONAL_SELF_MATTER, BUSINESS_OR_CORPORATE_MATTER, MULTI_PARTY_CASE_FILE
  - Detects business indicators (company names, VAT numbers, invoices)
  - Detects multi-party cases (case numbers, plaintiff/defendant terminology)

- **Authenticity Verification**:
  - Checks for fabrication, tampering, contradictions, forgery
  - Severity levels: none, low, medium, high, critical
  - Flags future dates, timeline inconsistencies, template markers

- **Session Locking**:
  - Locks session on constitutional violations (BUSINESS or MULTI_PARTY or high authenticity issues)
  - Generates sealed refusal reports
  - Prevents further operations until session restart

#### When Working on Enforcement
- Never bypass or weaken enforcement logic
- Always test with various document types
- Ensure denial messages are clear and professional
- Verify refusal reports are properly sealed

### Cryptographic Document Sealing
**Required**: All document uploads/downloads must be cryptographically sealed with SHA-256 hashes.

#### Implementation (`documentSealing.ts`)
- `sealDocument()`: Generates SHA-256 hash + timestamp + metadata
- `createVerifiablePackage()`: Bundles document with seal
- `verifySeal()`: Validates integrity of sealed documents

#### When Working with Documents
- Always seal documents on upload
- Include seal verification in download flows
- Preserve seal data in localStorage/KV store
- Display seal status to users (timestamp, hash preview)

### Forensic Language Rules
**AI Constraint**: The AI assistant must use professional forensic language.

#### Rules (from `constitutionalEnforcement.ts`)
- Use objective, evidence-based language
- Avoid absolute conclusions without supporting evidence
- Include uncertainty acknowledgments where appropriate
- Follow legal standards for analysis
- Never fabricate or hallucinate information

#### When Working on AI Integration
- Apply `getForensicLanguageRules()` to AI system prompts
- Test AI responses for compliance with forensic standards
- Ensure AI never makes definitive legal conclusions without caveat

### Android-Specific Features
- **Geolocation**: Jurisdiction detection via Capacitor Geolocation
- **File System**: Document storage via Capacitor Filesystem
- **Offline Support**: Core features work without internet
- **Performance**: Optimize for mobile devices (lazy loading, code splitting)

## Design System

### Colors (OKLCH Color Space)
- **Primary**: Deep navy blue `oklch(0.25 0.05 250)` - Authority & trust
- **Secondary**: Slate gray `oklch(0.45 0.02 250)` - Subtle UI elements
- **Accent**: Bright gold `oklch(0.75 0.15 85)` - Key actions (sparingly)
- **Background**: White `oklch(0.98 0 0)`
- **Muted**: Light gray `oklch(0.96 0 0)`

All color pairings maintain WCAG AAA contrast ratios (7:1+).

### Typography
- **Primary Font**: IBM Plex Sans
- **Monospace**: IBM Plex Mono (for code, citations)
- **Scale**: 
  - H1: 32px bold, tight tracking (-0.02em)
  - H2: 20px semibold
  - Body: 16px regular, 1.6 line-height
  - Caption: 13px regular

### Animations
- **Subtle & Professional**: Minimal animations for feedback
- **Timing**: 100-300ms transitions, ease-out curves
- **Examples**: Fade-in messages (200ms), button press (100ms), scroll (300ms)

### Component Usage
- Prefer existing UI components from `src/components/ui/`
- Follow Radix UI patterns for accessibility
- Use `toast` (sonner) for temporary notifications
- Use `AlertDialog` for confirmations
- Maintain consistent spacing with Tailwind utilities

## Common Pitfalls & Considerations

### Do's ✅
- **Always** seal documents with SHA-256 before storage
- **Always** apply constitutional enforcement on document uploads
- **Always** use TypeScript types strictly
- **Always** test Android builds after web changes
- **Always** maintain professional, authoritative UI tone
- **Always** preserve existing authentication state
- Use `useKV` for data that needs to persist across sessions
- Handle loading states and errors gracefully
- Validate user input with zod schemas

### Don'ts ❌
- **Never** bypass constitutional enforcement checks
- **Never** remove or weaken document sealing
- **Never** use `any` types without justification
- **Never** commit `local.properties` (contains local SDK paths)
- **Never** commit sensitive data or API keys
- **Never** ignore ESLint errors without understanding them
- Don't make breaking changes to existing sealed document formats
- Don't change forensic language rules without review
- Don't add large dependencies without considering mobile bundle size

### Security Considerations
- **Cryptographic Sealing**: SHA-256 for all documents
- **Session Security**: Cryptographically secure session IDs
- **No Server Storage**: All data stored client-side (localStorage/KV)
- **Input Validation**: Sanitize all user inputs
- **XSS Prevention**: Use React's built-in escaping
- **Report Sensitive Issues**: Email opensource-security@github.com

### Performance Considerations
- **Mobile First**: Optimize for Android devices
- **Bundle Size**: Keep dependencies minimal
- **Lazy Loading**: Consider code splitting for large features
- **PDF Handling**: Large PDFs may need streaming/chunking
- **State Updates**: Batch state changes when possible

## Documentation References

- **README.md**: General project overview
- **PRD.md**: Product requirements and design specifications
- **ANDROID_BUILD.md**: Detailed Android build instructions
- **ANDROID_STUDIO_QUICKSTART.md**: Quick start guide for Android Studio
- **CONSTITUTIONAL_ENFORCEMENT.md**: Enforcement system details
- **SECURITY.md**: Security reporting procedures

## Working with Issues

### When Assigned an Issue
1. **Read completely**: Understand the full requirement
2. **Check existing code**: Review related components/services
3. **Minimal changes**: Make surgical, focused changes
4. **Test thoroughly**: Web + Android if applicable
5. **Document if needed**: Update relevant .md files for significant features
6. **Respect constraints**: Follow all constitutional and security requirements

### Good Tasks for AI Assistance
- Bug fixes in UI or logic
- New UI components following existing patterns
- Documentation updates
- Code refactoring with clear scope
- Test case additions (when test infrastructure exists)
- Accessibility improvements

### Tasks Requiring Human Review
- Changes to constitutional enforcement logic
- Modifications to cryptographic sealing
- Major architectural changes
- Security-sensitive features
- Android-specific native code
- Build system configuration changes

## Android Studio Specific Guidance

### Opening the Project
1. Launch Android Studio
2. Select "Open an Existing Project"
3. Navigate to the `android` folder (not repository root)
4. Wait for Gradle sync to complete

### Common Gradle Issues
- **"SDK location not found"**: Create `local.properties` with correct path
- **"Unsupported Java version"**: Set JDK to 17+ in File > Project Structure
- **"Plugin too old"**: Update Gradle plugin in `build.gradle`
- **Build fails**: Ensure `npm run build` completed successfully first

### Running on Device
1. Enable USB debugging on Android device
2. Connect device via USB
3. Select device in Android Studio run configuration
4. Click Run (green play button)

### Building APK
1. Build > Build Bundle(s)/APK(s) > Build APK(s)
2. Signed APK: Build > Generate Signed Bundle/APK
3. APK location: `android/app/build/outputs/apk/`

### Debugging
- Use Android Studio's Logcat for runtime logs
- Chrome DevTools for web debugging (via chrome://inspect)
- Set breakpoints in WebView code
- Check Capacitor logs for bridge issues

## AI Model Configuration

When working with AI features in this codebase:

### Model Selection
- Use models suitable for professional legal analysis
- Prefer models with strong reasoning capabilities
- Consider context window size for long documents

### Prompt Engineering
- Always include forensic language rules in system prompts
- Provide clear instructions for objective analysis
- Include disclaimers about not providing legal advice
- Structure prompts for reproducible, factual responses

### Error Handling
- Handle API failures gracefully with user-friendly messages
- Implement retry logic for transient failures
- Never expose API errors directly to users
- Provide fallback behavior when AI is unavailable

## Summary

**Verum Omnis** is a sophisticated legal forensics platform with strict security and constitutional enforcement requirements. When contributing:

1. **Respect Security**: Never bypass enforcement or sealing
2. **Maintain Quality**: Follow TypeScript and React best practices
3. **Think Mobile**: Consider Android impact for all changes
4. **Professional Tone**: Keep UI/UX authoritative and refined
5. **Test Thoroughly**: Verify both web and Android builds
6. **Minimal Changes**: Make surgical, focused modifications
7. **Ask When Unsure**: Constitutional/security changes need human review

This is a professional legal tool - every change should reinforce trust, security, and reliability.
