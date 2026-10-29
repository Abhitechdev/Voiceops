# VoiceOps — Testing & Quality Assurance Report

## 1. Automated Test Suites (31/31 Passing)

The project includes two complementary test suites verified with **Pytest**:
1. **Root Services Test Suite (`tests/`):** 18 tests covering the core modular services powering the Hugging Face Space Gradio application (STT adapter, extraction heuristics, ticket lifecycle, and analytics).
2. **FastAPI Test Suite (`backend/tests/`):** 13 tests covering REST API endpoints, JWT authentication, and CORS.

### Test Execution Command
```bash
$env:PYTHONPATH = ".;backend"
& "backend\.venv\Scripts\pytest.exe" tests backend\tests -v
```

### Verified Test Cases Breakdown

| Test Suite / File | Test Case | Target Requirement | Status |
|---|---|---|---|
| `tests/test_service_extraction.py` | `test_extract_english_network_issue` | English categorization & lab location parsing | **PASSED** |
| `tests/test_service_extraction.py` | `test_extract_telugu_codemixed_projector_issue` | Code-mixed Telugu hardware issue & HDMI parsing | **PASSED** |
| `tests/test_service_extraction.py` | `test_extract_critical_electrical_safety_hazard` | Critical safety hazard escalation (spark / breaker) | **PASSED** |
| `tests/test_service_extraction.py` | `test_extract_missing_location_flagged` | Missing location detection & prompt flag | **PASSED** |
| `tests/test_service_extraction.py` | `test_extract_empty_transcript_raises_value_error` | Empty transcript validation (raises ValueError) | **PASSED** |
| `tests/test_service_tickets.py` | `test_ticket_create_validation_empty_title` | Pydantic validation (empty titles rejected) | **PASSED** |
| `tests/test_service_tickets.py` | `test_sequential_ticket_id_generation` | Sequential unique ID generation (`VO-1001`, `VO-1002`) | **PASSED** |
| `tests/test_service_tickets.py` | `test_idempotent_duplicate_prevention` | Duplicate submission rejection (90-second window) | **PASSED** |
| `tests/test_service_tickets.py` | `test_ticket_status_lifecycle_and_audit` | Status workflow (`Open → In Progress → Resolved`), notes, audit trail | **PASSED** |
| `tests/test_service_tickets.py` | `test_ticket_internal_note_creation` | Technician observation notes logging | **PASSED** |
| `tests/test_service_tickets.py` | `test_ticket_search_and_filters` | Multi-criteria search and category filtering | **PASSED** |
| `tests/test_service_transcription.py` | `test_validate_nonexistent_audio_raises_value_error` | Audio file presence validation | **PASSED** |
| `tests/test_service_transcription.py` | `test_validate_unsupported_audio_extension` | Unsupported audio extension rejection | **PASSED** |
| `tests/test_service_transcription.py` | `test_validate_empty_audio_file_raises_value_error` | Empty (0 bytes) audio file rejection | **PASSED** |
| `tests/test_service_transcription.py` | `test_transcribe_mock_mode_success` | High-fidelity mock adapter execution | **PASSED** |
| `tests/test_service_transcription.py` | `test_test_connection_when_no_api_key` | Connection latency checker without credentials | **PASSED** |
| `tests/test_service_analytics.py` | `test_analytics_empty_database_zero_state` | Clean zero-state verification (no division by zero) | **PASSED** |
| `tests/test_service_analytics.py` | `test_analytics_calculated_from_db_records` | Real DB aggregations, SLA overdue counts, turnaround | **PASSED** |
| `backend/tests/test_health.py` | `test_health_check` | Service Liveness & Config | **PASSED** |
| `backend/tests/test_auth.py` | `test_register_and_login` | JWT Authentication & registration | **PASSED** |
| `backend/tests/test_transcription.py` | `test_transcription_empty_file_rejected` | HTTP 400 empty audio rejection | **PASSED** |
| `backend/tests/test_transcription.py` | `test_transcription_unsupported_extension_rejected` | HTTP 415 unsupported media type rejection | **PASSED** |
| `backend/tests/test_transcription.py` | `test_transcription_mock_service_success` | FastAPI STT endpoint response schema | **PASSED** |
| `backend/tests/test_extraction.py` | `test_extract_network_issue` | FastAPI endpoint issue extraction | **PASSED** |
| `backend/tests/test_extraction.py` | `test_extract_hardware_issue_code_mixed` | FastAPI endpoint code-mixed parsing | **PASSED** |
| `backend/tests/test_extraction.py` | `test_extract_electrical_critical_issue` | FastAPI endpoint critical priority rule | **PASSED** |
| `backend/tests/test_extraction.py` | `test_extract_missing_location_flagged` | FastAPI endpoint missing location handling | **PASSED** |
| `backend/tests/test_tickets.py` | `test_ticket_lifecycle_and_history` | FastAPI endpoint ticket lifecycle | **PASSED** |
| `backend/tests/test_tickets.py` | `test_ticket_list_and_filter` | FastAPI endpoint filtering and query params | **PASSED** |
| `backend/tests/test_analytics.py` | `test_analytics_empty_database_zero_state` | FastAPI endpoint zero-state analytics | **PASSED** |
| `backend/tests/test_analytics.py` | `test_analytics_calculated_from_db` | FastAPI endpoint real DB analytics | **PASSED** |

---

## 2. Multilingual & Code-Mixed Speech Test Set

The following test samples are verified across the extraction component:

### Sample 1: English Lab Outage
- **Spoken Input:** "The computer lab 3 internet has not been working since morning, students cannot submit their lab assignments."
- **Extracted Title:** "Internet connectivity failure in Computer Lab 3"
- **Extracted Category:** `Network`
- **Extracted Location:** `Computer Lab 3`
- **Assigned Priority:** `High` (Class / assignment impact)

### Sample 2: Telugu-English Code-Mixed Projector Failure
- **Spoken Input:** "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi."
- **Extracted Title:** "Projector display failure in Classroom Two"
- **Extracted Category:** `Hardware`
- **Extracted Location:** `Classroom Two` (recognized via Telugu preposition "lo")
- **Assigned Priority:** `High`

### Sample 3: Critical Electrical Safety Hazard
- **Spoken Input:** "Power socket near workbench four is sparking and tripping the main circuit breaker."
- **Extracted Title:** "Electrical spark / power fault in Workbench Four"
- **Extracted Category:** `Electrical`
- **Extracted Location:** `Workbench Four`
- **Assigned Priority:** `Critical` (Immediate safety hazard detected)

### Sample 4: Missing Location Handling
- **Spoken Input:** "A ceiling light is flickering very annoying and making buzzing sound."
- **Missing Information Flag:** `['location']`
- **System Action:** System blocks silent assumptions and prompts user to supply room or block before creating the ticket.
