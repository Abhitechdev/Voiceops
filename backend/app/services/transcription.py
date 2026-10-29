import os
import random
import time
import httpx
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException, status
from app.config import settings

SAMPLE_MOCK_TRANSCRIPTS = [
    {
        "language": "en-IN",
        "transcript": "The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments.",
        "duration": 5.4,
        "confidence": 0.94
    },
    {
        "language": "te-IN",
        "transcript": "కంప్యూటర్ ల్యాబ్ లో ఇంటర్నెట్ ఉదయం నుండి పనిచేయడం లేదు, విద్యార్థులు అసైన్మెంట్లు సబ్మిట్ చేయలేకపోతున్నారు.",
        "duration": 6.1,
        "confidence": 0.92
    },
    {
        "language": "te-IN",  # Code-mixed Telugu + English
        "transcript": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
        "duration": 4.8,
        "confidence": 0.91
    },
    {
        "language": "en-IN",
        "transcript": "The projector in seminar hall A is showing distorted colors and keeps restarting every five minutes.",
        "duration": 5.0,
        "confidence": 0.96
    },
    {
        "language": "en-IN",
        "transcript": "Power socket near electronics lab bench four is sparking and tripping the main circuit breaker.",
        "duration": 4.2,
        "confidence": 0.95
    },
    {
        "language": "en-IN",
        "transcript": "Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor.",
        "duration": 5.8,
        "confidence": 0.93
    }
]


class GnaniTranscriptionService:
    def __init__(self):
        self.mock_mode = settings.GNANI_MOCK_MODE
        self.api_key = settings.GNANI_API_KEY
        self.endpoint = settings.GNANI_API_ENDPOINT
        self.default_language = settings.GNANI_LANGUAGE_CODE

    async def validate_audio_file(self, file: UploadFile) -> bytes:
        """Validate audio file extension, MIME type, and size limits."""
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No audio file uploaded."
            )

        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in settings.allowed_audio_exts:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio extension '.{ext}'. Allowed: {settings.ALLOWED_AUDIO_EXTENSIONS}"
            )

        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty (0 bytes)."
            )

        max_bytes = settings.MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file exceeds maximum allowed limit of {settings.MAX_AUDIO_FILE_SIZE_MB}MB."
            )

        return content

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio using Gnani AI STT API or verified mock fallback.
        In mock mode, provides realistic Indian language and code-mixed speech.
        """
        lang = language or self.default_language

        if self.mock_mode or not self.api_key:
            # High-fidelity mock adapter with simulated processing latency
            time.sleep(0.3)
            # Pick a representative sample matching the requested language if possible
            matched = [s for s in SAMPLE_MOCK_TRANSCRIPTS if s["language"] == lang]
            selected = random.choice(matched if matched else SAMPLE_MOCK_TRANSCRIPTS)

            return {
                "transcript": selected["transcript"],
                "language": lang,
                "confidence": selected["confidence"],
                "duration_seconds": selected["duration"],
                "provider": "mock_gnani_adapter",
                "message": "Transcribed via Gnani AI Mock Adapter (Set GNANI_API_KEY in .env to connect to live Gnani API endpoint)"
            }

        # Real Gnani AI STT API Call
        try:
            # Gnani Vach API standard header
            headers = {
                "X-API-Key-ID": self.api_key,
                "Authorization": f"Bearer {self.api_key}"
            }
            files = {
                "audio_file": (filename, audio_bytes, content_type)
            }
            data = {
                "language_code": lang
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    files=files,
                    data=data
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Gnani AI service error ({response.status_code}): {response.text}"
                )

            data = response.json()
            # Extract transcript from Gnani Vach v3 response
            transcript_text = data.get("transcript") or data.get("text") or data.get("result", {}).get("transcript", "")
            
            # If Gnani returns an empty transcript due to silence / blank recording
            if not transcript_text:
                transcript_text = "No speech detected in audio recording."

            return {
                "transcript": transcript_text,
                "language": lang,
                "confidence": data.get("confidence", 0.95),
                "duration_seconds": round(float(data.get("processing_time", 0.0)), 2),
                "provider": "gnani_ai_prisma_v2.5",
                "message": f"Successfully transcribed via Gnani AI ({data.get('model', 'prisma-v2.5')})",
                "raw_response": data
            }
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to communicate with Gnani AI endpoint: {str(exc)}"
            )

    async def test_connection(self) -> Dict[str, Any]:
        """
        Verify live connectivity and authentication with Gnani AI STT service.
        """
        if not self.api_key:
            return {
                "connected": False,
                "mode": "mock",
                "message": "GNANI_API_KEY is not configured in .env."
            }

        import struct
        import time

        start_time = time.time()
        # Minimal silent 0.5s 16kHz WAV payload
        num_samples = 8000
        sample_rate = 16000
        wav_header = struct.pack(
            '<4sI4s4sIHHIIHH4sI',
            b'RIFF', 36 + num_samples * 2, b'WAVE',
            b'fmt ', 16, 1, 1, sample_rate, sample_rate * 2, 2, 16,
            b'data', num_samples * 2
        )
        wav_bytes = wav_header + (b'\x00\x00' * num_samples)

        headers = {
            "X-API-Key-ID": self.api_key
        }
        files = {
            "audio_file": ("ping.wav", wav_bytes, "audio/wav")
        }
        data = {
            "language_code": "en-IN"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(self.endpoint, headers=headers, files=files, data=data)
            latency_ms = round((time.time() - start_time) * 1000, 2)

            if res.status_code == 200:
                body = res.json()
                return {
                    "connected": True,
                    "status_code": res.status_code,
                    "latency_ms": latency_ms,
                    "model": body.get("model", "prisma-v2.5"),
                    "request_id": body.get("request_id"),
                    "provider": "Gnani AI (Prisma v2.5)",
                    "message": "Gnani AI STT API connection successful and authenticated."
                }
            else:
                return {
                    "connected": False,
                    "status_code": res.status_code,
                    "latency_ms": latency_ms,
                    "error": res.text,
                    "message": f"Gnani AI responded with HTTP {res.status_code}"
                }
        except Exception as exc:
            return {
                "connected": False,
                "error": str(exc),
                "message": f"Connection to Gnani AI endpoint failed: {str(exc)}"
            }


transcription_service = GnaniTranscriptionService()

