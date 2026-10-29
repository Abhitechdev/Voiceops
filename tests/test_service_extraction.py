"""
Unit tests for VoiceOps Issue Extraction Service (services/extraction.py).
Tests English, Telugu, code-mixed Indic transcripts, and missing location detection.
"""

import pytest
from services.extraction import IssueExtractionService
from schemas.issues import TicketCategory, TicketPriority


@pytest.fixture
def extractor():
    svc = IssueExtractionService()
    # Force deterministic rule-based mode for fast, offline, reproducible tests
    svc.openai_key = ""
    return svc


def test_extract_english_network_issue(extractor):
    transcript = "The computer lab 3 internet has not been working since morning, students cannot submit their lab assignments."
    result = extractor.extract(transcript, language="en-IN")

    assert result.category == TicketCategory.NETWORK
    assert "Computer Lab 3" in result.location or "lab 3" in result.location.lower()
    assert result.priority in (TicketPriority.HIGH, TicketPriority.CRITICAL)
    assert len(result.title) > 0
    assert len(result.description) > 0
    assert "location" not in result.missing_fields


def test_extract_telugu_codemixed_projector_issue(extractor):
    transcript = "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi."
    result = extractor.extract(transcript, language="te-IN")

    assert result.category == TicketCategory.HARDWARE
    assert result.priority in (TicketPriority.HIGH, TicketPriority.MEDIUM)
    assert len(result.title) > 0
    assert len(result.description) > 0


def test_extract_critical_electrical_safety_hazard(extractor):
    transcript = "Power socket near workbench four is sparking and tripping the main circuit breaker."
    result = extractor.extract(transcript, language="en-IN")

    assert result.category == TicketCategory.ELECTRICAL
    assert result.priority == TicketPriority.CRITICAL
    assert "spark" in result.reasoning.lower() or "critical" in result.reasoning.lower()


def test_extract_missing_location_flagged(extractor):
    transcript = "A ceiling light is flickering very annoying and making buzzing sound."
    result = extractor.extract(transcript, language="en-IN")

    assert result.category in (TicketCategory.ELECTRICAL, TicketCategory.FACILITIES)
    # Location should be flagged missing because no room/lab was mentioned
    assert "location" in result.missing_fields or result.location == "Unspecified / Needs Confirmation"


def test_extract_empty_transcript_raises_value_error(extractor):
    with pytest.raises(ValueError):
        extractor.extract("", language="en-IN")
    with pytest.raises(ValueError):
        extractor.extract("   ", language="te-IN")
