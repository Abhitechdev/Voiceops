"""
Unit tests for VoiceOps Gnani Transcription Adapter (services/transcription.py).
Tests audio file validation, mock fallback mode, and connection check.
"""

import os
import tempfile
import pytest
from services.transcription import GnaniTranscriptionService


@pytest.fixture
def transcription_svc():
    svc = GnaniTranscriptionService()
    svc.mock_mode = True  # Guarantee isolated mock testing
    return svc


def test_validate_nonexistent_audio_raises_value_error(transcription_svc):
    with pytest.raises(ValueError, match="No audio file provided"):
        transcription_svc.validate_audio("non_existent_audio_file.wav")


def test_validate_unsupported_audio_extension(transcription_svc):
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"plain text content")
        tmp_name = f.name

    try:
        with pytest.raises(ValueError, match="Unsupported audio format"):
            transcription_svc.validate_audio(tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)


def test_validate_empty_audio_file_raises_value_error(transcription_svc):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        # 0 bytes
        tmp_name = f.name

    try:
        with pytest.raises(ValueError, match="Audio recording is empty"):
            transcription_svc.validate_audio(tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)


def test_transcribe_mock_mode_success(transcription_svc):
    # Create a small valid-extension file with dummy bytes
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(b"RIFF....WAVEfmt ....data....")
        tmp_name = f.name

    try:
        result = transcription_svc.transcribe(tmp_name, language="te-IN")
        assert "transcript" in result
        assert len(result["transcript"]) > 0
        assert result["language"] == "te-IN"
        assert result["confidence"] > 0.0
        assert "Mock Adapter" in result["provider"] or "Gnani AI" in result["provider"]
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)


def test_test_connection_when_no_api_key(transcription_svc):
    transcription_svc.api_key = ""
    res = transcription_svc.test_connection()
    assert res["connected"] is False
    assert "not configured" in res["message"].lower()
