# VoiceOps — Technical Architecture Document

## 1. System Overview

**VoiceOps** is a voice-first operational issue reporting and lifecycle management platform engineered for the **Gnani AI Great Indian AI Internship Challenge 2026** and deployed on **Hugging Face Spaces** (`nono455/Voiceops`).

The core premise is converting informal spoken complaints (supporting Telugu, Indian English, Hindi, and code-mixed Telugu-English speech) into structured, validated, and trackable service tickets. VoiceOps connects AI speech recognition directly to ground-level campus operations, preventing lost complaints and ensuring operational transparency.

```text
+---------------------------------------------------------------------------------------------------+
|                                     HUGGING FACE SPACE (Gradio)                                    |
|                                                                                                   |
|  [Tab 1: 🎙️ Report]        [Tab 2: 📋 Register]       [Tab 3: 🔍 Dispatch]    [Tab 4: 📊 Ops]     |
|   - Web Audio / Upload      - Live Ticket DataFrame    - Work Order Lookup     - Real Database KPIs|
|   - 5 Evaluation Presets    - Multi-Filter (Status,    - Status Transitions    - Category Breakdown|
|   - Transcript Editor         Category, Priority)      - Resolution Notes      - Severity Matrix   |
|   - Structured Field Form   - Free-Text Search Engine  - Audit Trail Timeline  - SLA Target Slider |
|   - Campus Location Chips                                                                          |
+-----------------------------------+-----------------------------------+---------------------------+
                                    |                                   |
                                    v                                   v
+---------------------------------------------------+   +-------------------------------------------+
|               MODULAR SERVICE LAYER               |   |            PERSISTENCE LAYER              |
|                                                   |   |                                           |
|  1. Audio & STT (`services/transcription.py`):    |   |  Supabase PostgreSQL Session Pooler:      |
|     - MIME & File Size Validator (<15MB, 120s)    |   |  - Host: aws-0-eu-west-1.pooler.          |
|     - Live Gnani AI STT Adapter (vachana.ai)      |   |          supabase.com:5432                |
|     - Mock Adapter with authentic Indic presets   |   |  - Dialect: PostgreSQL (psycopg 3 / 2)    |
|                                                   |   |                                           |
|  2. Structured Extraction (`services/extraction`):|   |  Relational Schema (`database/schema.sql`)|
|     - Indic Regex & Campus Location Detector      |   |  - `users`: Authenticated roles           |
|     - Missing location blocker (no hallucination) |   |  - `tickets`: Work orders (VO-1001)       |
|     - Critical safety hazard escalation heuristics|   |  - `ticket_history`: Immutable audit trail|
|     - OpenAI GPT-4o-mini structured JSON fallback |   |  - `ticket_notes`: Technician logs        |
|                                                   |   |                                           |
|  3. Ticket Lifecycle (`services/ticket_service`): |   |  Connection Safety:                       |
|     - Sequential ID generator (`VO-1001`)         |   |  - `pool_pre_ping=True`                   |
|     - Idempotency guard (90s window)              |   |  - Automatic SQLite fallback if offline   |
|     - Audit trail logging on every status change  |   |                                           |
|                                                   |   |                                           |
|  4. Analytics Engine (`services/analytics.py`):   |   |                                           |
|     - Real database row aggregations (no mock UI) |   |                                           |
|     - Safe zero-state division protection         |   |                                           |
|     - Dynamic SLA overdue threshold evaluation    |   |                                           |
+---------------------------------------------------+   +-------------------------------------------+
```

---

## 2. Core Workflow Sequence

1. **Audio Recording & Ingestion:**
   - Captured in browser via Gradio Audio component or uploaded file (`.wav`, `.mp3`, `.webm`, `.ogg`, `.m4a`).
   - Validated: rejected if 0 bytes, over 15MB, or invalid extension.

2. **Speech Recognition via Gnani AI STT:**
   - Evaluates `GNANI_API_KEY` and `GNANI_API_ENDPOINT`.
   - Sends multipart audio payload with `language_code` (`te-IN`, `en-IN`, `hi-IN`).
   - Fallback adapter with authentic domain samples when running without live API credentials.

3. **Human-in-the-Loop Transcript Review:**
   - Editable transcript text box.
   - Distinguishes original raw STT output from user-reviewed text.

4. **Structured Information Extraction:**
   - Deterministic keyword and regex parser + LLM option.
   - Categorizes: `Network`, `Hardware`, `Electrical`, `Plumbing`, `Facilities`, `Software`, `Other`.
   - Detects campus locations (e.g. `Computer Lab 3`, `Seminar Hall 1`, `ECE Block`).
   - Flags missing fields (e.g. unspecified room) so unconfirmed data is never assumed.
   - Determines operational priority: `Low`, `Medium`, `High`, `Critical`.

5. **Ticket Creation & Numbering:**
   - Confirmed details persisted to Supabase PostgreSQL.
   - Generates sequential unique ID: `VO-1001`, `VO-1002`, etc.
   - Idempotency guard prevents duplicate submissions within 90 seconds.
   - Initial status set to `Open`.
   - Automatic audit history entry created in `ticket_history`.

6. **Ticket Lifecycle & Assignment:**
   - Status transitions: `Open → In Progress → Resolved → Closed`.
   - Assignable to technicians with internal notes.
   - Resolution notes recorded upon completion with `resolved_at` timestamp.

7. **Operational Analytics:**
   - Calculated entirely from real database records (no hardcoded demo stats).
   - Zero-state safety: Produces clean zeros when database is empty.
   - SLA tracking: Identifies overdue tickets past configured target (e.g., 48h).

---

## 3. Security, Privacy & Reliability

- **Zero Permanent Audio Retention:** Audio streams are held only in temporary buffers during the transcription transaction and discarded immediately after.
- **Server-Side Secret Management:** Database credentials and API keys are read strictly through environment variables and Space Secrets. No credentials are leaked to the client browser.
- **Network Resilience:** Supabase database connectivity utilizes the official IPv4 Session Pooler (`aws-0-eu-west-1.pooler.supabase.com:5432`) to circumvent IPv6-only cloud routing issues.
