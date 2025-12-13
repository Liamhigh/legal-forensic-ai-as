# Visual Guide: Logo and Watermark Integration

## Application Header with Logos

The application header now features a professional dual-logo layout:

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo 1]  ⚖️  VERUM OMNIS          [🔒 Session]  [Logo 2]  [Clear] │
│             AI Forensics for Truth                                  │
└────────────────────────────────────────────────────────────────────┘
```

**Logo 1** (Left): Positioned before the scale icon and branding
**Logo 2** (Right): Positioned after the session status

Both logos are displayed as 40x40px rounded images for a clean, professional appearance.

## Initial View (No Messages)

When you first open the application, you'll see:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Header with Logos]                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 Master Forensic Archive                    [Open PDF] ────► │
│                                                                  │
│  🛡️ Forensic Document Sealing                                    │
│  Upload documents to seal...                                    │
│  [Upload Document to Seal] ────────────────────────────────────►│
│                                                                  │
│  📝 Generate Forensic Report                                     │
│  Export analysis with watermark...                              │
│  ☑️ Include watermark indicator    [View Watermark] ──────────►│
│  🔒 Password Protection: [________]                             │
│  [Generate & Download Report] ──────────────────────────────────►│
│                                                                  │
│  Welcome to Verum Omnis                                         │
│  ⚖️                                                               │
│  Your AI-powered legal forensics assistant                      │
│                                                                  │
│  [Analyze digital evidence...]  [Review chain of custody...]    │
│  [Identify Brady violations...] [Examine testimony...]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Report Generator Component

The Report Generator appears in two contexts:
1. On initial load (with sample content)
2. After AI conversations (with AI responses as content)

### Component UI Elements:

```
┌─────────────────────────────────────────────────────────────────┐
│  📝  Generate Forensic Report                                    │
│     Export analysis with watermark and optional password         │
│                                                                  │
│  ☑️ Include watermark indicator         [View Watermark] ──────►│
│                                                                  │
│  🔒 Password Protection (Optional)                               │
│  [Enter password to protect report...]                          │
│  Leave blank for unprotected report. Protected reports          │
│  require password to view full content.                         │
│                                                                  │
│  [📥 Generate & Download Report] ───────────────────────────────►│
│                                                                  │
│  Document Information:                                          │
│  File: example.pdf                                              │
│  Hash: a3f5b8c2d1e4f7g9...                                      │
│  Jurisdiction: United States                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Generated Report (Without Password)

When you generate a report without password protection:

```
═══════════════════════════════════════════════════════════════════
                    VERUM OMNIS FORENSIC REPORT
                        Legal Evidence Analysis
═══════════════════════════════════════════════════════════════════

[WATERMARKED - See /assets/watermark.png for visual watermark]

Report Title: Forensic Analysis: document.pdf
Generated: 2025-12-13T18:20:00.000Z
Report ID: VOR-ABC123-XYZ789

───────────────────────────────────────────────────────────────────
DOCUMENT INFORMATION
───────────────────────────────────────────────────────────────────

File Name: document.pdf
Document Hash (SHA-256): a3f5b8c2d1e4f7g9h2j4k6...
Sealed Date: 12/13/2025, 6:20:00 PM
Jurisdiction: United States

───────────────────────────────────────────────────────────────────
FORENSIC ANALYSIS
───────────────────────────────────────────────────────────────────

This document appears to be authentic based on metadata analysis.
The timestamps are consistent and no contradictions were detected.
Chain of custody has been properly maintained.

───────────────────────────────────────────────────────────────────
REPORT CERTIFICATION
───────────────────────────────────────────────────────────────────

This report was generated by Verum Omnis AI Forensics System.
All findings are based on automated forensic analysis.

Report Hash: 4b7c9e2f1a3d5g8h
Certified: 2025-12-13T18:20:00.000Z

═══════════════════════════════════════════════════════════════════
```

## Generated Report (With Password)

When you generate a report with password protection:

```
╔═══════════════════════════════════════════════════════════════════╗
║                     PASSWORD REQUIRED                              ║
║                                                                     ║
║  This report is password protected. To view the full content,     ║
║  please export this document as PDF and enter the password.        ║
║                                                                     ║
║  Password hash (first 8 chars): a3f5b8c2...                        ║
╚═══════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════
                    VERUM OMNIS FORENSIC REPORT
                        Legal Evidence Analysis
═══════════════════════════════════════════════════════════════════

[WATERMARKED - See /assets/watermark.png for visual watermark]
[PASSWORD PROTECTED - Password required to view full content]

Report Title: ████████ ████████: ████████.███
Generated: ████-██-████████:██:██.████
Report ID: VOR-██████-██████

───────────────────────────────────────────────────────────────────
DOCUMENT INFORMATION
───────────────────────────────────────────────────────────────────

File Name: ████████.███
Document Hash (SHA-███): ████████████████████...
Sealed Date: ██/██/████, █:██:██ ██
Jurisdiction: ██████ ██████

───────────────────────────────────────────────────────────────────
FORENSIC ANALYSIS
───────────────────────────────────────────────────────────────────

████ ████████ ███████ ██ ██ █████████ █████ ██ ████████ ████████.
███ ██████████ ███ ██████████ ███ ██ ██████████████ ████ █████████.
█████ ██ ███████ ███ ████ █████████ ██████████.

───────────────────────────────────────────────────────────────────
```

## Watermark Image

When you click "View Watermark", you'll see:
- A new tab opens displaying the watermark PNG
- High-resolution 1024x1536px image
- RGBA format with transparency support
- Professional watermark design

## Conversation View with Report Generator

After having a conversation with the AI:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Header with Logos]                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User: Analyze the admissibility of this evidence               │
│                                                        6:15 PM   │
│                                                                  │
│  Assistant: Based on forensic analysis, this evidence           │
│  appears admissible under Federal Rules of Evidence...          │
│                                                        6:15 PM   │
│                                                                  │
│  User: What about chain of custody?                             │
│                                                        6:16 PM   │
│                                                                  │
│  Assistant: The chain of custody documentation shows...         │
│                                                        6:16 PM   │
│                                                                  │
│  📝 Generate Forensic Report                                     │
│  [Report Generator with AI responses as content]                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Input field]                              [Send ▶️]            │
└─────────────────────────────────────────────────────────────────┘
```

## User Interactions

### Uploading a Document
1. Click "Upload Document to Seal"
2. Select file from file picker
3. Document is automatically sealed with SHA-256 hash
4. Seal information displayed with download option

### Generating a Report
1. Click in Report Generator area
2. Toggle watermark option (on by default)
3. Optionally enter password
4. Click "Generate & Download Report"
5. File automatically downloads as `.txt` file

### Viewing Watermark
1. Click "View Watermark" button
2. New tab opens with watermark PNG
3. Can save or print watermark separately

## Color Scheme

The application uses a professional color scheme:
- **Primary**: Accent colors for buttons and highlights
- **Card Background**: Subtle background for content cards
- **Borders**: Clean borders separating sections
- **Text**: High contrast for readability

## Responsive Design

All elements are responsive and adapt to different screen sizes:
- Mobile: Single column layout
- Tablet: Optimized spacing
- Desktop: Full width with max-width constraint

## Accessibility

- High contrast text
- Clear button labels
- Keyboard navigation support
- Screen reader friendly
- Focus indicators on interactive elements

## Toast Notifications

User actions trigger toast notifications:
- ✓ Success: Green toast for successful operations
- ⚠️ Warning: Yellow toast for cautions
- ✗ Error: Red toast for errors
- ℹ️ Info: Blue toast for information

Examples:
- "✓ Document sealed cryptographically"
- "✓ Forensic report generated successfully"
- "✓ Report is password protected"
- "⚠️ Document accepted with caution flags"
- "✗ Failed to generate report"

## Next Steps

To see the implementation in action:

```bash
npm run dev
```

Then visit http://localhost:5000 and explore:
1. Header logos
2. Document upload and sealing
3. Report generation with/without password
4. Watermark viewing
5. AI conversation and report export
