# Ollama Integration Implementation Plan

## Summary

**Recommendation:** Use **Ollama** as the primary AI backend for South African law enforcement.

**Why:**
- Completely offline (works without internet)
- Free (no API costs for under-resourced agencies)
- Data stays on device (POPIA compliance, data sovereignty)
- No government dependency
- Forensic engine unaffected (stays 100% offline)

---

## Current State vs. Proposed State

### Current Architecture (GitHub Spark)
```
Forensic Engine (Offline) ←→ GitHub Spark API (Cloud)
                                ↓
                         gpt-4o or other models
```

**Problem:** Depends on GitHub/cloud, costs money, data leaves device

### Proposed Architecture (Ollama)
```
Forensic Engine (Offline) ←→ Ollama (Local)
                                ↓
                         Llama 2, Mistral, etc.
                         (runs on local machine)
```

**Solution:** Completely offline, free, data stays local

---

## Implementation Roadmap

### Phase 1: Keep Everything Working (0 hours)
- Spark integration stays as-is
- Forensic engine unchanged
- App still builds and runs normally

### Phase 2: Add Ollama Support Layer (2 hours)
**File:** Create `src/services/aiBackends.ts`

```typescript
// Support multiple AI backends
interface AIBackend {
  name: string;
  isAvailable(): Promise<boolean>;
  chat(prompt: string): Promise<string>;
}

class OllamaBackend implements AIBackend {
  name = 'ollama';
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async chat(prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'mistral', // or llama2
        prompt: prompt,
        stream: false
      })
    });
    const data = await response.json();
    return data.response;
  }
}

class SparkBackend implements AIBackend {
  name = 'spark';
  
  async isAvailable(): Promise<boolean> {
    return !!window.spark?.llm;
  }
  
  async chat(prompt: string): Promise<string> {
    const response = await window.spark.llm(prompt, 'gpt-4o');
    return response;
  }
}

// Smart backend selector
export async function getAIBackend(): Promise<AIBackend | null> {
  // Try Ollama first (local, preferred)
  const ollama = new OllamaBackend();
  if (await ollama.isAvailable()) {
    return ollama;
  }
  
  // Fall back to Spark if available
  const spark = new SparkBackend();
  if (await spark.isAvailable()) {
    return spark;
  }
  
  // No AI available - forensic engine still works
  return null;
}
```

### Phase 3: Update Chat Handler (1 hour)
**File:** Modify `src/App.tsx`

```typescript
// Current code uses window.spark.llm directly
// Change to use AI backend selector

import { getAIBackend } from './services/aiBackends';

// In handleSendMessage:
async function handleSendMessage(content: string) {
  try {
    const backend = await getAIBackend();
    
    if (!backend) {
      // AI not available, show helpful message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'AI not available. Forensic scanning still works! Enable Ollama for AI features.'
      }]);
      return;
    }
    
    const response = await backend.chat(systemPrompt + content);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response
    }]);
  } catch (error) {
    // Error handling...
  }
}
```

### Phase 4: Configuration (30 minutes)
**File:** Create `ollama.config.ts`

```typescript
export const ollamaConfig = {
  enabled: process.env.VITE_OLLAMA_ENABLED !== 'false',
  url: process.env.VITE_OLLAMA_URL || 'http://localhost:11434',
  model: process.env.VITE_OLLAMA_MODEL || 'mistral',
  timeout: 60000 // 60 seconds for local processing
};
```

### Phase 5: Documentation (30 minutes)
**File:** Create `OLLAMA_DEPLOYMENT_GUIDE.md`

```markdown
# Ollama Deployment Guide for SA Law Enforcement

## What is Ollama?

Ollama runs AI models locally on your machine. No internet required, no data leaves your device.

## Installation

### Windows/Mac/Linux

1. Download from https://ollama.ai
2. Install normally
3. Done!

## First Run

1. Open terminal
2. Run: `ollama pull mistral`
3. Wait for download (about 5 minutes)
4. Ollama runs at http://localhost:11434

## Using with Verum Omnis

1. Start Ollama: `ollama serve`
2. Open Verum Omnis
3. Chat features now work locally!

## Models Available

- **Mistral** (7B) - Fast, good quality
- **Llama 2** (7B/13B/70B) - Flexible size
- **Neural Chat** - Optimized for conversation

## Offline Use

Ollama works completely offline:
1. Download model once
2. Never needs internet again
3. All processing on your machine

## Data Privacy

- All evidence stays on your computer
- No cloud upload
- No internet transmission
- Meets POPIA requirements
```

### Phase 6: Testing (1 hour)
- Test Ollama available → use Ollama
- Test Spark available (no Ollama) → use Spark
- Test neither available → graceful degradation

---

## Decision Timeline

**Today:** Approve Ollama as strategy
**This week:** Implement integration
**Next week:** Test and document
**Week after:** Deploy to SA agencies

---

## What Doesn't Change

- ✅ Forensic engine stays 100% offline
- ✅ Document sealing unchanged
- ✅ PDF generation unchanged
- ✅ Certificate creation unchanged
- ✅ Evidence management unchanged
- ✅ App still works without any AI

---

## What Changes

- 🔄 AI chat now prefers local Ollama
- 🔄 Falls back to Spark if needed
- 🔄 Works completely offline with Ollama
- 🔄 Zero API costs with Ollama

---

## Key Benefit for SA Law Enforcement

| Before (Spark) | After (Ollama) |
|---|---|
| Cloud-dependent | Completely local |
| API costs per request | Free forever |
| Data leaves device | Data stays local |
| Internet required | Works offline |
| Government infrastructure needed | No external dependency |

---

## Next Action

**Ready to implement?**

Once you confirm:
1. I'll implement the Ollama integration (4 hours total)
2. Test both backends work
3. Create deployment documentation
4. Commit to main branch

This keeps your forensic engine pure while giving SA agencies the choice: Ollama (local), Spark (cloud), or neither (forensic engine only).
