# VoiceOps — Testing & Quality Assurance Report

## 1. Automated Test Suite (Pytest)

The backend test suite is implemented using **Pytest** with SQLite in-memory isolated sessions (`StaticPool`). All tests run without external service dependencies.

### Test Execution Command
```bash
& "backend\.venv\Scripts\pytest.exe" -v
```

### Verified Test Cases (13/13 Passing)

| Test Module | Test Case | Target Requirement | Verdict |
|---|---|---|---|
| `test_health.py` | `test_health_check` | Service Liveness & Config | **PASSED** |
| `test_auth.py` | `test_register_and_login` | FR-08: Authentication & JWT | **PASSED** |
| `test_transcription.py` | `test_transcription_empty_file_rejected` | FR-01: Empty Audio Validation (400) | **PASSED** |
| `test_transcription.py` | `test_transcription_unsupported_extension_rejected` | FR-01: Format Validation (415) | **PASSED** |
| `test_transcription.py` | `test_transcription_mock_service_success` | FR-02: Gnani AI STT Adapter | **PASSED** |
| `test_extraction.py` | `test_extract_network_issue` | FR-04: Network Categorization & Lab Location | **PASSED** |
| `test_extraction.py` | `test_extract_hardware_issue_code_mixed` | FR-04: Code-Mixed Telugu & Projector Detection | **PASSED** |
| `test_extraction.py` | `test_extract_electrical_critical_issue` | FR-04: Critical Priority Rule (Spark/Breaker) | **PASSED** |
| `test_extraction.py` | `test_extract_missing_location_flagged` | FR-04: Missing Field Detection | **PASSED** |
| `test_tickets.py` | `test_ticket_lifecycle_and_history` | FR-05 & FR-06: Creation, VO-1001 ID, Status Lifecycle, Notes, Audit Trail | **PASSED** |
| `test_tickets.py` | `test_ticket_list_and_filter` | FR-06: Multi-Criteria Filter & Search | **PASSED** |
| `test_analytics.py` | `test_analytics_empty_database_zero_state` | FR-07: Clean Zero-State Verification | **PASSED** |
| `test_analytics.py` | `test_analytics_calculated_from_db` | FR-07: Real Database Aggregations | **PASSED** |

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
- **Spoken Input:** "A ceiling light is flickering very annoying."
- **Missing Information Flag:** `['location']`
- **System Action:** System blocks silent assumptions and prompts user to supply room or block before creating the ticket.
