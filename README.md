---
title: VoiceOps - Voice-First Issue Management System
emoji: 🎙️
colorFrom: green
colorTo: indigo
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# VoiceOps — Voice-First Operational Issue Management System

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Gradio](https://img.shields.io/badge/Gradio-4.44+-orange.svg)](https://gradio.app/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Gnani AI](https://img.shields.io/badge/AI-Gnani%20Speech%20to%20Text-indigo.svg)](https://gnani.ai/)
[![Tests](https://img.shields.io/badge/tests-31%20passed-brightgreen.svg)]()

> **Target:** Gnani AI Great Indian AI Internship Challenge 2026  
> **Deployment Target:** Hugging Face Spaces (`nono455/Voiceops`)  
> **Core Architecture:** Gradio 5-Tab Operational Console + Supabase PostgreSQL + Gnani AI STT Adapter

---

## 1. Executive Summary & Product Objective

Organizations such as college campuses, IT support desks, and facility management departments frequently receive informal spoken complaints (e.g. broken projectors, Wi-Fi outages, water leaks, electrical hazards). These complaints are often lost, lack critical contextual fields (such as room or equipment identifier), or are never formally assigned or tracked to resolution.

**VoiceOps** is a production-minded, voice-first issue reporting and lifecycle management platform. It allows users to:
1. **Record or Upload Audio:** Capture spoken complaints in Indian languages (Telugu `te-IN`, Indian English `en-IN`, Hindi `hi-IN`, and Telugu-English code-mixed speech).
2. **Transcribe via Gnani AI:** Process speech using the Gnani AI Speech-to-Text engine (`https://api.vachana.ai/stt/v3`) with a high-fidelity local fallback adapter.
3. **Review & Correct Transcripts:** Perform human-in-the-loop transcript edits prior to triage, maintaining original vs. reviewed distinctions.
4. **Structured Information Extraction:** Automatically identify Category, Campus Location, Priority, and Asset ID, while flagging missing information.
5. **Confirm & Commit:** Persist confirmed work orders into **Supabase PostgreSQL** with sequential human-readable identifiers (`VO-1001`, `VO-1002`).
6. **Track & Dispatch:** Enable technicians to filter tickets, transition statuses (`Open → In Progress → Resolved → Closed`), log resolution notes, and inspect audit histories.
7. **Live Operations Analytics:** Compute real-time KPI metrics, SLA overdue alerts, and category/priority histograms calculated strictly from database records.

---

## 2. Architecture & Data Flow

```text
+-------------------------------------------------------------------------------+
|                       VOICEOPS GRADIO CONSOLE (app.py)                        |
|                                                                               |
|  [Tab 1: 🎙️ Report]  [Tab 2: 📋 Register]  [Tab 3: 🔍 Dispatch] [Tab 4: 📊 Ops] |
|   - Audio Mic/Upload   - Live DataFrame       - Incident Details   - Real KPIs|
|   - Evaluation Presets - Multi-Filter Search  - Status Transitions - Histograms|
|   - Transcript Editor  - Real-Time Query      - Resolution Notes   - SLA Alert|
+-------------------+-----------------------------------+-----------------------+
                    |                                   |
                    v                                   v
+-----------------------------------+   +---------------------------------------+
|      SERVICES / ADAPTER LAYER     |   |          PERSISTENCE LAYER            |
|                                   |   |                                       |
| - services/transcription.py       |   | - Supabase PostgreSQL (IPv4 Pooler)   |
|   Gnani AI STT (vachana.ai)       |   |   aws-0-eu-west-1.pooler.supabase.com |
|   Audio Validation (15MB, 120s)   |   |   Tables:                             |
| - services/extraction.py          |   |     `users` (RBAC accounts)           |
|   Indic Regex + OpenAI Extractor  |   |     `tickets` (Work orders)           |
| - services/ticket_service.py      |   |     `ticket_history` (Audit log)      |
|   Sequential VO-1001, Idempotency |   |     `ticket_notes` (Technician notes) |
| - services/analytics.py           |   | - services/db.py                      |
|   Real SQL Aggregations & SLA     |   |   SQLAlchemy 2.0 with Session Pool    |
+-----------------------------------+   +---------------------------------------+
```

---

## 3. Hugging Face Space Deployment (`nono455/Voiceops`)

This application is engineered specifically for direct deployment to the existing Hugging Face Space:
- **Repository:** `https://huggingface.co/spaces/nono455/Voiceops`
- **Application Entry Point:** `app.py`
- **Hardware:** Free CPU (ZeroGPU compatible)
- **Dependencies:** `requirements.txt`

### Space Secrets Configuration

To run with full live cloud integrations on Hugging Face Spaces, navigate to **Settings → Variables and Secrets → New Secret** and define:

| Secret Name | Description | Example / Required Format |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL Connection Pooler URL | `postgresql://postgres.uskhvfuvuodjjysxiuqj:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `GNANI_API_KEY` | Gnani AI Speech-to-Text API Key | `vach_...` |
| `GNANI_API_ENDPOINT` | Gnani AI STT v3 endpoint | `https://api.vachana.ai/stt/v3` |
| `GNANI_MOCK_MODE` | Set to `false` for live API calls | `false` |
| `OPENAI_API_KEY` | Optional: OpenAI API Key for hybrid extraction | `sk-proj-...` |

> **Note on Supabase Pooler Networking:** Direct Supabase database domains (`db.[project].supabase.co`) only resolve IPv6 addresses. Free CPU cloud instances frequently lack IPv6 routing. VoiceOps connects through the official Supabase IPv4 Session Pooler (`aws-0-eu-west-1.pooler.supabase.com:5432`) to guarantee 100% cloud network reachability.

---

## 4. Gnani AI Speech-to-Text Integration Details

The speech transcription engine is decoupled inside `services/transcription.py`:
- **Endpoint:** `https://api.vachana.ai/stt/v3`
- **Authentication:** Header `X-API-Key-ID: <GNANI_API_KEY>` and `Authorization: Bearer <GNANI_API_KEY>`
- **Payload:** Multipart form-data with binary `audio_file` and form field `language_code` (`te-IN`, `en-IN`, `hi-IN`).
- **Validation Pipeline:**
  - File extension check: `.wav`, `.mp3`, `.webm`, `.ogg`, `.m4a`
  - Max file size: 15 MB
  - Empty file detection: Reject 0-byte recordings with actionable guidance
- **Zero Audio Retention:** Temporary audio buffers are deleted immediately after transcription. No audio recordings are permanently stored on Space disk.

---

## 5. Structured Issue Extraction Engine

VoiceOps implements a dual-engine extraction architecture in `services/extraction.py`:
1. **Indic Domain Rules & Regex Engine:**
   - Detects categories (`Network`, `Hardware`, `Electrical`, `Plumbing`, `Facilities`, `Software`, `Other`).
   - Identifies campus locations using Indic prepositions (e.g., Telugu *"Computer Lab lo"*, *"Seminar Hall 1"*).
   - Enforces critical safety heuristics (e.g. *spark*, *fire*, *circuit breaker trip* escalate immediately to `Critical`).
   - Flags missing information: If no location or equipment is stated, it explicitly flags `['location']` in `missing_fields` instead of hallucinating.
2. **LLM Structured Parser (OpenAI / Gemini compatible):**
   - Automatically engaged when `OPENAI_API_KEY` is present.
   - Generates structured JSON matching Pydantic validation schemas.

---

## 6. Supabase Relational Database Schema

VoiceOps persists all operational data to Supabase PostgreSQL using `database/schema.sql`:

- **`users` Table:**
  - Authentication identities, roles (`admin`, `technician`, `reporter`), full names, and timestamps.
- **`tickets` Table:**
  - `ticket_number`: Unique sequential index (`VO-1001`, `VO-1002`).
  - `title`, `description`, `category`, `location`, `priority`, `status`.
  - `transcript_original` vs. `transcript_reviewed`: Full audit evidence.
  - `assigned_to`, `assignee_name`, `resolution_notes`, `resolved_at`.
- **`ticket_history` Table:**
  - Immutable audit trail recording every state change, actor, previous value, new value, and timestamp.
- **`ticket_notes` Table:**
  - Technician work log comments attached to work orders.

---

## 7. Automated Test Suite (31/31 Passing)

Both unit and integration test suites run with 100% pass rates:

```bash
# Run the complete test suite
$env:PYTHONPATH = ".;backend"
& "backend\.venv\Scripts\pytest.exe" tests backend\tests -v
```

### Verified Test Categories:
- **`tests/test_service_extraction.py` (5 tests):**
  - English network issue categorization & campus lab extraction.
  - Telugu / code-mixed projector hardware detection.
  - Critical electrical hazard safety escalation.
  - Missing location detection & flagging.
  - Empty transcript validation (`ValueError`).
- **`tests/test_service_tickets.py` (6 tests):**
  - Sequential `VO-1001`, `VO-1002` generation.
  - Idempotent duplicate submission prevention (90s window).
  - Pydantic validation (empty titles rejected).
  - Status transition lifecycle (`Open → In Progress → Resolved`).
  - Technician note creation & retrieval.
  - Multi-criteria filter & free-text search.
- **`tests/test_service_analytics.py` (2 tests):**
  - Clean zero-state behavior on empty database (no division-by-zero).
  - Real database metrics, SLA overdue calculations, and mean turnaround time.
- **`tests/test_service_transcription.py` (5 tests):**
  - Non-existent audio file validation.
  - Unsupported extension rejection (e.g. `.txt`, `.exe`).
  - Empty 0-byte file rejection.
  - High-fidelity mock adapter execution.
  - API connection probe structure.
- **`backend/tests/` (13 tests):**
  - Full FastAPI endpoint tests (auth, JWT, CORS, health, transcriptions, tickets, analytics).

---

## 8. Five-Tab Gradio Application Guide

1. **🎙️ Tab 1 — Report an Issue:**
   - Record via browser microphone or upload audio.
   - Choose language (`Telugu`, `Indian English`, `Hindi`).
   - Quick-Evaluation Presets: Click any of 5 pre-recorded scenario chips for instant evaluation.
   - Editable transcript box for human verification.
   - Structured issue form with location selector chips (`Computer Lab 3`, `Seminar Hall 1`, `ECE Block`).
   - One-click confirmation submitting directly to Supabase.
2. **📋 Tab 2 — Ticket Register:**
   - Live interactive DataFrame of all active tickets.
   - Real-time search query across titles, descriptions, and locations.
   - Filter dropdowns for Status, Category, and Priority.
3. **🔍 Tab 3 — Ticket Details & Dispatch:**
   - Enter or select any ticket number (`VO-1001`).
   - View complete incident details, original audio evidence, and reviewed transcript.
   - Operational status transition selector with resolution note field.
   - Work order audit trail timeline showing history of actions.
   - Internal technician notes logging.
4. **📊 Tab 4 — Operations Control Room:**
   - Real-time KPI table: Total Work Orders, Pending Triage, In Active Fix, Resolved/Closed, SLA Overdue, Mean Turnaround.
   - Category breakdown histogram.
   - Priority severity matrix.
   - Interactive SLA target slider (dynamically recalculating overdue work orders).
5. **⚙️ Tab 5 — Telemetry & System Status:**
   - Real-time ping tester for Gnani AI STT API measuring latency.
   - Supabase PostgreSQL connection checker.
   - Voice privacy protocol and data retention policy.

---

## 9. Evaluation Preset Scenarios

For rapid testing in the Gradio UI without microphone access:
1. **Telugu-English Code-Mixed:** *"Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi."*
2. **Computer Lab Internet Outage (Telugu):** *"కంప్యూటర్ ల్యాబ్ లో ఇంటర్నెట్ ఉదయం నుండి పనిచేయడం లేదు, విద్యార్థులు అసైన్మెంట్లు సబ్మిట్ చేయలేకపోతున్నారు."*
3. **Lab 3 Internet Outage (English):** *"The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments."*
4. **Electrical Spark Hazard:** *"Power socket near electronics lab bench four is sparking and tripping the main circuit breaker."*
5. **Water Leakage:** *"Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor."*

---

## 10. Repository File Structure

```text
voiceops/
├── app.py                      # Production Gradio Space Application (5 Tabs)
├── requirements.txt            # Hugging Face Space Python dependencies
├── README.md                   # Space documentation & YAML metadata
├── services/                   # Modular service layer
│   ├── db.py                   # Supabase PostgreSQL engine & SQLAlchemy models
│   ├── transcription.py        # Gnani AI STT adapter & audio validation
│   ├── extraction.py           # Indic regex & OpenAI structured issue parser
│   ├── ticket_service.py       # Sequential VO-1001 numbering, idempotency & audit
│   ├── analytics.py            # Real SQL metrics, SLA calculations, turnaround
│   └── supabase_service.py     # Supabase health & count queries
├── schemas/
│   └── issues.py               # Pydantic v2 schemas & enums
├── database/
│   ├── schema.sql              # Supabase PostgreSQL DDL schema & triggers
│   └── seed_supabase.py        # Database initializer & sample records seeder
├── tests/                      # Pytest suite for root modular services (18 tests)
│   ├── conftest.py             # Isolated SQLite in-memory fixtures
│   ├── test_service_extraction.py
│   ├── test_service_tickets.py
│   ├── test_service_analytics.py
│   └── test_service_transcription.py
├── backend/                    # FastAPI backend with complementary tests (13 tests)
├── frontend/                   # Next.js 14 Web Application
└── docs/                       # Architecture & QA specifications
```
