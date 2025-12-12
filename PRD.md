# Planning Guide

Verum Omnis is the world's first AI-powered legal forensics platform that helps legal professionals analyze evidence, research case law, and construct compelling arguments through an intelligent conversational interface.

**Experience Qualities**: 
1. **Authoritative** - The interface should project confidence, precision, and trustworthiness befitting a professional legal tool
2. **Sophisticated** - Clean, refined aesthetics that reflect the gravity and complexity of legal work
3. **Focused** - Streamlined interactions that minimize distractions and maximize analytical clarity

**Complexity Level**: Light Application (multiple features with basic state)
This is a conversational interface with message history, suggested prompts, and persistent chat sessions - more complex than a single-purpose tool but not requiring multiple views or advanced backend integrations.

## Essential Features

### Chat Interface
- **Functionality**: AI-powered conversational interface for legal forensic analysis
- **Purpose**: Primary interaction method for users to ask legal questions, analyze evidence, and receive expert guidance
- **Trigger**: User types a question or selects a suggested prompt
- **Progression**: User enters query → Message appears in chat → AI processes → Response streams in → Message history updates → User can continue conversation
- **Success criteria**: Messages persist across sessions, responses are clearly formatted, interface remains responsive during AI generation

### Suggested Prompts
- **Functionality**: Pre-defined legal forensic query templates
- **Purpose**: Guide users toward effective use cases and reduce friction for common tasks
- **Trigger**: Displayed when chat is empty or after each response
- **Progression**: User views suggestions → Clicks suggestion → Suggestion populates input → Auto-submits query
- **Success criteria**: Prompts are contextually relevant to legal forensics, clicking a prompt initiates the conversation smoothly

### Message History
- **Functionality**: Persistent storage and display of all chat messages
- **Purpose**: Maintain context for ongoing legal analysis and allow users to reference previous discussions
- **Trigger**: Loads automatically on app start, updates after each message exchange
- **Progression**: App loads → Previous messages display → User scrolls through history → New messages append to bottom
- **Success criteria**: Messages persist across browser sessions, scroll behavior is smooth, long conversations remain readable

### Clear Conversation
- **Functionality**: Reset the chat to start fresh analysis
- **Purpose**: Allow users to begin new cases or topics without previous context
- **Trigger**: User clicks clear/new chat button
- **Progression**: User clicks clear → Confirmation (optional) → Messages clear → Empty state with suggestions appears
- **Success criteria**: Conversation clears completely, suggestion prompts reappear, cleared data doesn't return

## Edge Case Handling

- **Empty State** - Display branded welcome message with logo/tagline and initial suggested prompts to guide first-time users
- **Network Errors** - Show inline error message if AI call fails, allow retry without losing user's input
- **Long Messages** - Auto-scroll to bottom on new messages, preserve scroll position when user scrolls up to read history
- **Rapid Input** - Disable input and send button while AI is generating response to prevent multiple concurrent requests
- **Empty Input** - Disable send button when input field is empty to prevent blank submissions

## Design Direction

The design should evoke the gravitas of legal practice - authoritative, precise, and trustworthy. The interface should feel like a sophisticated professional tool, not a casual chat app. Deep navy blues and crisp whites create a serious, credible atmosphere, while subtle touches of metallic silver add refinement without distraction.

## Color Selection

The color scheme draws from traditional legal aesthetics (navy, white, gold) with a modern, high-tech twist.

- **Primary Color**: Deep navy blue (oklch(0.25 0.05 250)) - Conveys authority, trust, and professionalism associated with legal institutions
- **Secondary Colors**: Slate gray (oklch(0.45 0.02 250)) for subtle UI elements; Midnight blue (oklch(0.18 0.06 250)) for deeper contrast areas
- **Accent Color**: Bright gold (oklch(0.75 0.15 85)) - Represents truth and justice, used sparingly for key actions and highlights
- **Foreground/Background Pairings**: 
  - Background (White oklch(0.98 0 0)): Navy text (oklch(0.25 0.05 250)) - Ratio 9.2:1 ✓
  - Primary (Navy oklch(0.25 0.05 250)): White text (oklch(0.98 0 0)) - Ratio 9.2:1 ✓
  - Accent (Gold oklch(0.75 0.15 85)): Navy text (oklch(0.25 0.05 250)) - Ratio 5.1:1 ✓
  - Muted (Light gray oklch(0.96 0 0)): Slate text (oklch(0.45 0.02 250)) - Ratio 7.3:1 ✓

## Font Selection

Typography should reflect legal documentation - clear, authoritative, and highly readable for extended analysis sessions.

- **Primary Font**: IBM Plex Sans - A professional, technical typeface with excellent readability and subtle authority
- **Secondary Font**: IBM Plex Mono - For code blocks, case citations, or any monospaced content

- **Typographic Hierarchy**: 
  - H1 (Brand Title): IBM Plex Sans Bold/32px/tight tracking (-0.02em)
  - H2 (Section Headers): IBM Plex Sans Semibold/20px/normal
  - Body (Messages): IBM Plex Sans Regular/16px/relaxed leading (1.6)
  - Caption (Timestamps, Meta): IBM Plex Sans Regular/13px/normal with muted color
  - Button Text: IBM Plex Sans Medium/15px/tight tracking

## Animations

Animations should be minimal and purposeful - reinforcing the professional nature of the tool while providing necessary feedback.

- Message appearance: Subtle fade-in with slight upward movement (200ms ease-out) as AI responses arrive
- Typing indicator: Gentle pulsing animation for three dots while AI processes
- Button interactions: Quick scale-down on press (100ms) with color shift for tactile feedback
- Scroll behavior: Smooth auto-scroll to new messages (300ms ease-in-out)
- Clear confirmation: Subtle fade-out of messages (250ms) before clearing

## Component Selection

- **Components**: 
  - `Input` + `Button` for message composition area with send icon
  - `ScrollArea` for message history with custom styling
  - `Card` for individual message bubbles (user vs AI differentiated)
  - `Button` variants for suggested prompts (outline style)
  - `AlertDialog` for clear conversation confirmation
  - `Separator` for subtle dividers between sections
  - Icons from `@phosphor-icons/react`: PaperPlaneRight (send), Trash (clear), Scales (legal icon), Gavel
  
- **Customizations**: 
  - Custom message bubble component with distinct styling for user (right-aligned, primary background) vs AI (left-aligned, card background)
  - Branded header with logo treatment using the sphere visual motif
  - Custom scrollbar styling to maintain professional aesthetic
  - Suggested prompt chips with hover states and smooth transitions
  
- **States**: 
  - Input: Focused state with gold ring, disabled state while AI responds
  - Send Button: Enabled (gold accent), disabled (muted), loading (with spinner)
  - Suggested Prompts: Default (outline), hover (filled with accent), active (pressed scale)
  - Messages: Streaming state (typing indicator), complete state (full message)
  
- **Icon Selection**: 
  - PaperPlaneRight for sending messages (action-oriented)
  - Scales or Gavel for legal context/branding
  - Trash or X for clearing conversation
  - Circle dots/SpinnerGap for loading states
  
- **Spacing**: 
  - Container padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
  - Message gaps: `gap-4` (16px) between messages
  - Input area padding: `p-4` (16px) around composition controls
  - Suggested prompt gaps: `gap-2` (8px) between chips
  
- **Mobile**: 
  - Stack header vertically on small screens, reduce logo size
  - Fix input area to bottom with `sticky` or `fixed` positioning
  - Reduce message bubble padding from `p-4` to `p-3`
  - Make suggested prompts scroll horizontally if needed
  - Ensure touch targets are minimum 44px for all interactive elements
