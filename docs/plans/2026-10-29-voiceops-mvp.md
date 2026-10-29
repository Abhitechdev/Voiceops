# VoiceOps Implementation Plan

> **For Agent:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Build VoiceOps — a voice-first issue reporting and management system converting spoken complaints (Telugu, English, code-mixed) into structured, trackable service tickets with Gnani AI speech recognition, review/editing, admin management, and database-backed operational analytics.

**Architecture:** Next.js (TypeScript + Tailwind CSS) responsive frontend communicating via REST APIs with a FastAPI (Python 3.11) backend. Pluggable speech-to-text service supporting official Gnani AI STT API with high-fidelity local mock fallback. Hybrid issue extraction (rules engine + optional LLM). SQLite/SQLAlchemy database with full ticket lifecycle (`Open → In Progress → Resolved → Closed`), audit history, and real database analytics aggregations.

**Tech Stack:** Next.js 14/15, TypeScript, Tailwind CSS, Lucide icons, Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, Pytest, Web Audio API / MediaRecorder.

---

## Phases Overview

- **Phase 0:** Requirements, Environment Verification, and Git / Configuration Setup
- **Phase 1:** Backend Foundation (FastAPI, Database models, Schemas, CORS, Health checks)
- **Phase 2:** Gnani AI STT Service & Voice Recording (Pluggable Gnani adapter, realistic mock fallback, audio validation)
- **Phase 3:** Issue Information Extraction (FR-04: Deterministic rule-based engine + optional LLM engine, field validation)
- **Phase 4:** Ticket Management & Persistence (FR-05, FR-06: CRUD, unique ID generator `VO-1001`, status transitions, audit history, notes)
- **Phase 5:** Admin Dashboard & Analytics (FR-07: Aggregated metrics, resolution time, distributions from real DB records)
- **Phase 6:** Authentication, Security & Privacy (FR-08, FR-10: Roles, token/session auth, consent notice, audio cleanup)
- **Phase 7:** Frontend Implementation (Next.js responsive web UI: VoiceRecorder, TranscriptEditor, IssueReviewForm, TicketTable, AnalyticsCharts)
- **Phase 8:** End-to-End Verification, Documentation & Demonstration Guide

---

### Task 1: Environment & Directory Structure Setup
- **Files:**
  - Create: `backend/requirements.txt`
  - Create: `backend/app/__init__.py`
  - Create: `backend/app/config.py`
  - Create: `backend/app/database.py`
  - Create: `backend/app/main.py`
  - Test: `backend/tests/test_health.py`
- Verify FastAPI starts up and returns 200 on `/api/health`.

### Task 2: Database Schema & SQLAlchemy Models
- **Files:**
  - Create: `backend/app/models/__init__.py`
  - Create: `backend/app/models/user.py`
  - Create: `backend/app/models/ticket.py`
  - Create: `backend/app/models/ticket_history.py`
  - Create: `backend/app/models/ticket_note.py`
  - Create: `backend/app/schemas/ticket.py`
  - Create: `backend/app/schemas/user.py`
  - Test: `backend/tests/test_models.py`
- Verify all database tables initialize in SQLite and relationships work cleanly.

### Task 3: Pluggable Gnani AI Speech-to-Text Adapter
- **Files:**
  - Create: `backend/app/services/transcription.py`
  - Create: `backend/app/routes/transcriptions.py`
  - Test: `backend/tests/test_transcription.py`
- Test audio validation (size, MIME type, duration), Gnani API adapter payload construction, and realistic mock fallback with Telugu, English, and code-mixed test samples.

### Task 4: Issue Information Extraction Engine (FR-04)
- **Files:**
  - Create: `backend/app/services/extraction.py`
  - Create: `backend/app/routes/issues.py`
  - Test: `backend/tests/test_extraction.py`
- Test deterministic keyword/regex extraction for college IT/facility domains:
  - Network (Wi-Fi, internet, router, lab connectivity)
  - Hardware (projector, PC, keyboard, monitor, printer)
  - Electrical (power socket, lights, AC, UPS)
  - Plumbing & Facility (water dispenser, classroom bench, door lock)
  - Location extraction (e.g. "classroom two", "computer lab 3", "library 2nd floor")
  - Priority heuristics (e.g. whole lab affected = High/Critical, single mouse = Low)
  - Missing field detection and confidence scoring.

### Task 5: Ticket Lifecycle Management & History (FR-05, FR-06)
- **Files:**
  - Create: `backend/app/services/ticket_service.py`
  - Create: `backend/app/routes/tickets.py`
  - Test: `backend/tests/test_tickets.py`
- Test ticket creation with `VO-1001` sequential numbering, status transitions (`Open → In Progress → Resolved → Closed`), assigning tickets, internal notes, resolution notes, and audit history logging.

### Task 6: Analytics & Metrics Engine (FR-07)
- **Files:**
  - Create: `backend/app/services/analytics_service.py`
  - Create: `backend/app/routes/analytics.py`
  - Test: `backend/tests/test_analytics.py`
- Test calculations derived purely from DB records:
  - Total tickets, open, in progress, resolved, closed
  - Distributions by category, priority, and location
  - Average resolution time (in minutes/hours)
  - Overdue calculations against SLA targets

### Task 7: Authentication & Access Control (FR-08)
- **Files:**
  - Create: `backend/app/security/auth.py`
  - Create: `backend/app/routes/auth.py`
  - Test: `backend/tests/test_auth.py`
- Test password hashing (bcrypt), JWT generation, Reporter role vs Admin role, and unauthorized route rejection.

### Task 8: Frontend Next.js Application Setup
- **Files:**
  - Scaffold: `frontend/` (Next.js with Tailwind CSS & Lucide icons)
  - Create: `frontend/src/lib/api.ts` (API client for backend communication)
  - Create: `frontend/src/components/Navbar.tsx`
  - Create: `frontend/src/components/ConsentNotice.tsx` (Privacy notice for audio recording)

### Task 9: Voice Reporting Interface (FR-01, FR-02, FR-03, FR-04)
- **Files:**
  - Create: `frontend/src/components/VoiceRecorder.tsx` (Web Audio MediaRecorder, waveform/pulse animation, timer, replay/discard)
  - Create: `frontend/src/components/TranscriptEditor.tsx` (Editable transcript, retry, audio preview)
  - Create: `frontend/src/components/IssueReviewForm.tsx` (Structured field validation, category/priority selection, location confirmation)
  - Create: `frontend/src/app/report/page.tsx` (Wizard flow: Record → Transcribe → Review → Extract → Confirm → Submit)

### Task 10: Ticket Register & Ticket Details Views (FR-05, FR-06)
- **Files:**
  - Create: `frontend/src/app/tickets/page.tsx` (Search, filter by status/category/priority, badge styling, sort)
  - Create: `frontend/src/app/tickets/[id]/page.tsx` (Detail view, status updater, assignment, internal notes, resolution notes, audit timeline)

### Task 11: Admin Analytics Dashboard (FR-07)
- **Files:**
  - Create: `frontend/src/components/DashboardCards.tsx`
  - Create: `frontend/src/components/AnalyticsCharts.tsx`
  - Create: `frontend/src/app/dashboard/page.tsx` (Live charts for status breakdown, category distribution, priority matrix, resolution velocity)

### Task 12: Seed Data, End-to-End Verification & Docs
- **Files:**
  - Create: `backend/seed_data.py` (Realistic sample complaints in Telugu, English, and code-mixed across campus IT/facilities)
  - Create: `docs/architecture.md`
  - Create: `docs/testing.md`
  - Create: `README.md`
  - Run full pytest test suite and frontend build verification.
