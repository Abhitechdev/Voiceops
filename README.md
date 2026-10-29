# VoiceOps — Voice-Based Issue Reporting and Management System

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Gnani AI](https://img.shields.io/badge/AI-Gnani%20Speech%20to%20Text-indigo.svg)](https://gnani.ai/)
[![Tests](https://img.shields.io/badge/tests-13%20passed-brightgreen.svg)]()

> **Target:** Gnani AI Great Indian AI Internship Challenge 2026  
> **Approach:** Phase-by-phase, test-driven implementation  
> **Status:** MVP Implemented & Verified

---

## 1. Executive Summary

Organizations such as college campuses, apartment complexes, and small businesses receive complaints through informal verbal conversations, phone calls, and messaging apps. These complaints are often lost, lack crucial context (e.g., location or category), or are never formally assigned or tracked.

**VoiceOps** is a voice-first operational issue reporting and lifecycle management platform. It allows users to record a complaint in Indian languages (Telugu, Indian English, and code-mixed speech), review and correct the speech transcript, confirm extracted structured fields, and submit an issue. Administrators can assign tickets, update workflow statuses, add technician notes, record resolutions, and monitor live database-backed operational analytics.

---

## 2. Core Workflow Pipeline

```text
[Record] -> [Transcribe] -> [Review] -> [Extract] -> [Confirm] -> [Submit] -> [Manage] -> [Resolve] -> [Analyze]
```

1. **Record:** User records speech via browser MediaRecorder with visual waveform frequency bars and elapsed timer.
2. **Transcribe:** Audio submitted to Gnani AI Speech-to-Text API (with high-fidelity local mock fallback).
3. **Review:** User can correct transcription errors before extraction, preserving original vs edited distinctions.
4. **Extract:** Automatic identification of Category, Location, and Priority. Crucially detects missing fields (e.g., missing room number).
5. **Confirm:** User reviews proposals and confirms before ticket creation.
6. **Submit:** Unique ticket generated (`VO-1001`), saved to database with initial status `Open`.
7. **Manage:** Administrators assign tickets, add internal notes, change status (`Open → In Progress → Resolved → Closed`).
8. **Analyze:** Live dashboard calculates distributions, resolution velocity, and overdue SLA violations from database records.

---

## 3. Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** FastAPI, Python 3.11, Pydantic v2, SQLAlchemy, Uvicorn
- **Database:** SQLite (default local zero-setup) / PostgreSQL supported
- **Speech-to-Text:** Gnani AI Speech-to-Text Service with pluggable architecture
- **Issue Extraction:** Deterministic domain heuristics + optional LLM integration (Gemini / OpenAI)
- **Testing:** Pytest with in-memory SQLite isolation (`StaticPool`)

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ (Node.js LTS portable is included in `C:\Users\Abhishek\.nodejs\node-v20.18.0-win-x64`)

### Step 1: Clone and Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To use live Gnani AI credentials, update `.env`:
```ini
GNANI_MOCK_MODE=false
GNANI_API_KEY=your_actual_gnani_api_key_here
GNANI_API_ENDPOINT=https://api.gnani.ai/v1/stt
```
*(If `GNANI_MOCK_MODE=true`, the platform runs in full standalone simulation mode with realistic Telugu, English, and code-mixed complaint samples).*

### Step 2: Start the FastAPI Backend
```bash
cd backend
# Activate virtual environment
& ".\.venv\Scripts\Activate.ps1"

# Seed realistic database records (optional, but recommended)
python seed_data.py

# Start Uvicorn server on port 8000
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Interactive Swagger docs: `http://localhost:8000/docs`

### Step 3: Start the Next.js Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:3000`

---

## 5. Default Evaluation Credentials

For seamless evaluator testing, the database includes pre-configured demo accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Campus IT Admin** | `admin@voiceops.internal` | `admin123` | Full ticket lifecycle, notes, SLA metrics |
| **Network Engineer** | `rajesh@voiceops.internal` | `tech123` | Assigned technician |
| **Student Reporter** | `ravi@student.college.edu` | `ravi123` | Issue reporting and status tracking |

---

## 6. Automated Test Suite

Run the full pytest suite (13 passing tests):
```bash
& "backend\.venv\Scripts\pytest.exe" -v
```

All core requirements are verified:
- `test_health.py`: Application health and configuration status
- `test_auth.py`: JWT login, registration, and user profiles
- `test_transcription.py`: File size/MIME validation, format checks, mock STT adapter
- `test_extraction.py`: Telugu code-mixed parsing, keyword categorization, location detection, missing field flags
- `test_tickets.py`: Sequential `VO-1001` generation, status workflow, notes, audit history
- `test_analytics.py`: Real database metrics and zero-state accuracy

---

## 7. Project Structure

```text
voiceops/
├── frontend/                     # Next.js 14 Responsive Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Hero landing page & recent reports
│   │   │   ├── report/page.tsx   # 5-step voice reporting wizard
│   │   │   ├── tickets/page.tsx  # Searchable & filterable ticket register
│   │   │   ├── tickets/[id]/     # Full ticket details & workflow manager
│   │   │   ├── dashboard/        # Operational analytics dashboard
│   │   │   └── login/            # Role authentication & demo autofill
│   │   ├── components/
│   │   │   ├── VoiceRecorder.tsx # Web Audio API recording & visualizer
│   │   │   ├── TranscriptEditor.tsx
│   │   │   ├── IssueReviewForm.tsx
│   │   │   ├── DashboardCards.tsx
│   │   │   └── AnalyticsCharts.tsx
│   │   └── lib/api.ts            # Typed API client
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py               # Application factory & CORS
│   │   ├── config.py             # Pydantic settings & env config
│   │   ├── database.py           # SQLAlchemy engine & session maker
│   │   ├── models/               # Database tables (users, tickets, history, notes)
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── routes/               # API routers (auth, transcriptions, issues, tickets, analytics)
│   │   ├── services/             # Gnani STT adapter, extraction engine, ticket service
│   │   └── security/             # JWT auth & password hashing
│   ├── tests/                    # Automated Pytest test suite
│   ├── seed_data.py              # Realistic sample tickets seeder
│   └── requirements.txt
├── docs/
│   ├── architecture.md           # System design & architecture sequence
│   └── testing.md                # Quality assurance & evaluation report
├── .env.example                  # Documented environment variables
├── PRD.md                        # Complete Product Requirements Document
└── README.md
```
