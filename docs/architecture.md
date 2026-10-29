# VoiceOps — Technical Architecture Document

## 1. System Overview

**VoiceOps** is a voice-first operational issue reporting and lifecycle management platform engineered for the **Gnani AI Great Indian AI Internship Challenge 2026**.

The core premise is converting spoken complaints (supporting Telugu, Indian English, and code-mixed Telugu-English speech) into structured, validated, and trackable service tickets. VoiceOps connects AI speech recognition directly to ground-level campus operations, preventing lost complaints and ensuring operational transparency.

```text
+--------------------------------------------------------------------------+
|                              REPORTER BROWSER                            |
|                                                                          |
|  [VoiceRecorder]              [TranscriptEditor]     [IssueReviewForm]   |
|   Web Audio API / MediaRecorder -> User Review/Edit ->  Confirmation     |
+------------------------------------+-------------------------------------+
                                     | HTTPS / REST
                                     v
+--------------------------------------------------------------------------+
|                            FASTAPI BACKEND                               |
|                                                                          |
|  - CORS & Rate Limiting                                                  |
|  - Audio MIME/Size Validator (Max 15MB, 120s)                             |
|  - Gnani AI STT Service Adapter (Live API + Mock Fallback)               |
|  - Hybrid Issue Information Extractor (Rules + Regex + Optional LLM)     |
|  - Ticket Lifecycle & Audit Engine                                       |
|  - Real Database Analytics Engine                                        |
+-------------------+----------------------------------+-------------------+
                    |                                  |
                    v                                  v
+-----------------------------------+  +-----------------------------------+
|          GNANI AI STT             |  |      ISSUE EXTRACTION ENGINE      |
|                                   |  |                                   |
| - Endpoint: /v1/stt               |  | - Domain Categorization           |
| - Languages: te-IN, en-IN, hi-IN  |  | - Location Detection              |
| - High-Fidelity Mock Adapter      |  | - Priority Heuristics             |
+-----------------------------------+  +-----------------------------------+
                    |                                  |
                    +-----------------+----------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|                         DATABASE LAYER (SQLite / PostgreSQL)             |
|                                                                          |
|  Tables: `users`, `tickets`, `ticket_history`, `ticket_notes`            |
+-------------------------------------+------------------------------------+
                                      |
                                      v
+--------------------------------------------------------------------------+
|                           ADMINISTRATOR DASHBOARD                        |
|                                                                          |
|  - Summary Cards (Total, Open, In Progress, Resolved, Overdue, SLA)      |
|  - Category Distribution Chart                                           |
|  - Priority Severity Matrix                                              |
|  - 7-Day Complaint Velocity Trend                                        |
|  - Audit History Timeline & Internal Notes                               |
+--------------------------------------------------------------------------+
```

## 2. Core Workflow Sequence

1. **Audio Recording (FR-01):**
   - Captured in browser via MediaRecorder in WebM format.
   - Live frequency audio visualizer and elapsed timer.
   - User controls: Start, Stop, Replay, Discard.

2. **Speech Recognition (FR-02):**
   - Secure backend endpoint `POST /api/transcriptions`.
   - Pluggable adapter: If `GNANI_MOCK_MODE=false` and API credentials are provided, connects to Gnani AI Speech-to-Text API. If credentials are not yet supplied, uses the high-fidelity mock adapter with authentic domain samples.
   - Client API key is never exposed to the browser.

3. **Transcript Review & Correction (FR-03):**
   - Editable transcript text box.
   - Distinguishes original raw STT output from user-reviewed text.

4. **Structured Information Extraction (FR-04):**
   - Fast deterministic keyword and regex parser.
   - Detects categories: Network, Hardware, Electrical, Plumbing, Facility.
   - Extracts campus locations: e.g. "Computer Lab 3", "Classroom Two".
   - Flags missing fields (e.g. unknown room) so unconfirmed data is never assumed.
   - Determines operational priority: Low, Medium, High, Critical.

5. **Ticket Creation & Numbering (FR-05):**
   - Confirmed details persisted to database.
   - Generates sequential unique ID: `VO-1001`, `VO-1002`, etc.
   - Initial status set to `Open`.
   - Automatic audit history entry created.

6. **Ticket Lifecycle & Assignment (FR-06):**
   - Status transitions: `Open → In Progress → Resolved → Closed`.
   - Assignable to technicians (e.g. Rajesh Kumar).
   - Internal staff notes with author stamps.
   - Resolution notes recorded upon completion.

7. **Operational Analytics (FR-07):**
   - Calculated entirely from real database records (no hardcoded demo stats).
   - Zero-state safety: Produces clean zeros when database is empty.
   - SLA tracking: Identifies overdue tickets past configured target (e.g., 48h).
