from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.services.transcription import transcription_service

router = APIRouter(prefix="/api/transcriptions", tags=["Transcription"])


@router.post("")
async def upload_and_transcribe_audio(
    file: UploadFile = File(..., description="Recorded audio file (wav, webm, mp3, ogg)"),
    language: Optional[str] = Form("te-IN", description="Language code (e.g., te-IN, en-IN)")
):
    """
    Upload voice recording and request speech-to-text transcription via Gnani AI service.
    Falls back gracefully to high-fidelity mock adapter if GNANI_MOCK_MODE=true or API key is absent.
    """
    audio_bytes = await transcription_service.validate_audio_file(file)

    result = await transcription_service.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.webm",
        content_type=file.content_type or "audio/webm",
        language=language
    )
    return result


@router.get("/test-connection")
async def test_gnani_connection():
    """
    Test live connectivity and authentication with Gnani AI Vach STT API.
    """
    return await transcription_service.test_connection()

