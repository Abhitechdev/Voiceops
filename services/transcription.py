"""
Gnani AI Speech-to-Text service adapter with audio validation and fallback handling.
"""

import os
import time
import random
import struct
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GNANI_API_KEY = os.getenv("GNANI_API_KEY", "")
GNANI_API_ENDPOINT = os.getenv("GNANI_API_ENDPOINT", "https://api.vachana.ai/stt/v3")
GNANI_LANGUAGE_CODE = os.getenv("GNANI_LANGUAGE_CODE", "te-IN")
GNANI_MOCK_MODE = os.getenv("GNANI_MOCK_MODE", "false").lower() in ("true", "1", "yes")

ALLOWED_AUDIO_EXTENSIONS = ["wav", "mp3", "webm", "ogg", "m4a"]
MAX_AUDIO_FILE_SIZE_MB = 15

SAMPLE_EVALUATION_TRANSCRIPTS = [
    {
        "language": "te-IN",  # Telugu + English code-mixed
        "transcript": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
        "duration": 4.8,
        "confidence": 0.94,
        "note": "Projector HDMI Fault (Code-Mixed Telugu)",
    },
    {
        "language": "te-IN",  # Pure Telugu
        "transcript": "కంప్యూటర్ ల్యాబ్ లో ఇంటర్నెట్ ఉదయం నుండి పనిచేయడం లేదు, విద్యార్థులు అసైన్మెంట్లు సబ్మిట్ చేయలేకపోతున్నారు.",
        "duration": 6.1,
        "confidence": 0.93,
        "note": "Computer Lab Internet Down (Telugu)",
    },
    {
        "language": "en-IN",  # Indian English
        "transcript": "The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments.",
        "duration": 5.4,
        "confidence": 0.96,
        "note": "Lab 3 Internet Outage (Indian English)",
    },
    {
        "language": "en-IN",  # Electrical
        "transcript": "Power socket near electronics lab bench four is sparking and tripping the main circuit breaker.",
        "duration": 4.2,
        "confidence": 0.95,
        "note": "Workbench Spark Hazard (English)",
    },
    {
        "language": "en-IN",  # Plumbing / Facilities
        "transcript": "Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor.",
        "duration": 5.8,
        "confidence": 0.92,
        "note": "Water Leakage 2nd Floor (English)",
    },
]


class GnaniTranscriptionService:
    def __init__(self):
        self.api_key = GNANI_API_KEY
        self.endpoint = GNANI_API_ENDPOINT
        self.default_language = GNANI_LANGUAGE_CODE
        self.mock_mode = GNANI_MOCK_MODE

    def validate_audio(self, file_path: str) -> Dict[str, Any]:
        """
        Validate audio file existence, extension, and size.
        Returns metadata dictionary if valid; raises ValueError if invalid.
        """
        if not file_path or not os.path.exists(file_path):
            raise ValueError("No audio file provided or file path is invalid.")

        ext = file_path.split(".")[-1].lower() if "." in file_path else ""
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            raise ValueError(
                f"Unsupported audio format '.{ext}'. Supported extensions: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
            )

        file_size_bytes = os.path.getsize(file_path)
        if file_size_bytes == 0:
            raise ValueError("Audio recording is empty (0 bytes). Please speak into the microphone.")

        max_bytes = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024
        if file_size_bytes > max_bytes:
            raise ValueError(
                f"Audio file size ({round(file_size_bytes / (1024*1024), 1)}MB) exceeds maximum limit of {MAX_AUDIO_FILE_SIZE_MB}MB."
            )

        return {
            "file_path": file_path,
            "extension": ext,
            "size_bytes": file_size_bytes,
            "size_mb": round(file_size_bytes / (1024 * 1024), 2),
        }

    def transcribe(self, file_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute speech-to-text inference with Gnani AI API.
        Falls back to high-fidelity mock adapter if mock mode is requested or no API key is set.
        """
        self.validate_audio(file_path)
        lang = language or self.default_language

        # Mock Mode or Missing API Key Fallback
        if self.mock_mode or not self.api_key:
            time.sleep(0.4)
            matched = [s for s in SAMPLE_EVALUATION_TRANSCRIPTS if s["language"] == lang]
            chosen = random.choice(matched if matched else SAMPLE_EVALUATION_TRANSCRIPTS)
            return {
                "transcript": chosen["transcript"],
                "language": lang,
                "confidence": chosen["confidence"],
                "duration_seconds": chosen["duration"],
                "provider": "Gnani AI (Mock Adapter)",
                "live": False,
                "message": "Transcribed via Gnani AI Adapter (Configure GNANI_API_KEY in Space Secrets for live API calls).",
            }

        # Real Live Gnani AI API Call
        try:
            with open(file_path, "rb") as f:
                audio_bytes = f.read()

            filename = os.path.basename(file_path)
            content_type = f"audio/{file_path.split('.')[-1]}"

            headers = {
                "X-API-Key-ID": self.api_key,
                "Authorization": f"Bearer {self.api_key}",
            }
            files = {
                "audio_file": (filename, audio_bytes, content_type),
            }
            data = {
                "language_code": lang,
            }

            with httpx.Client(timeout=30.0) as client:
                res = client.post(self.endpoint, headers=headers, files=files, data=data)

            if res.status_code != 200:
                # If Gnani returns error, report actionable feedback
                raise RuntimeError(
                    f"Gnani AI responded with HTTP {res.status_code}: {res.text[:200]}"
                )

            body = res.json()
            transcript_text = (
                body.get("transcript")
                or body.get("text")
                or body.get("result", {}).get("transcript", "")
            )
            if not transcript_text:
                transcript_text = "No intelligible speech detected in recording."

            return {
                "transcript": transcript_text,
                "language": lang,
                "confidence": float(body.get("confidence", 0.95)),
                "duration_seconds": round(float(body.get("processing_time", 0.0)), 2),
                "provider": f"Gnani AI ({body.get('model', 'Prisma v2.5')})",
                "live": True,
                "message": "Successfully transcribed by live Gnani AI Indic speech model.",
            }
        except httpx.RequestError as exc:
            raise RuntimeError(f"Network error communicating with Gnani AI endpoint: {str(exc)}")

    def test_connection(self) -> Dict[str, Any]:
        """Ping the Gnani AI endpoint with a minimal audio probe to measure latency."""
        if not self.api_key:
            return {
                "connected": False,
                "message": "GNANI_API_KEY is not configured.",
                "latency_ms": 0,
            }

        start = time.time()
        num_samples = 8000
        sample_rate = 16000
        wav_header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF", 36 + num_samples * 2, b"WAVE",
            b"fmt ", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16,
            b"data", num_samples * 2,
        )
        wav_bytes = wav_header + (b"\x00\x00" * num_samples)

        try:
            headers = {"X-API-Key-ID": self.api_key}
            files = {"audio_file": ("ping.wav", wav_bytes, "audio/wav")}
            data = {"language_code": "en-IN"}

            with httpx.Client(timeout=10.0) as client:
                res = client.post(self.endpoint, headers=headers, files=files, data=data)

            latency = round((time.time() - start) * 1000, 2)
            if res.status_code == 200:
                body = res.json()
                return {
                    "connected": True,
                    "latency_ms": latency,
                    "model": body.get("model", "prisma-v2.5"),
                    "request_id": body.get("request_id"),
                    "message": f"Gnani STT authenticated and responsive ({latency}ms).",
                }
            else:
                return {
                    "connected": False,
                    "latency_ms": latency,
                    "message": f"Gnani returned HTTP {res.status_code}: {res.text[:120]}",
                }
        except Exception as exc:
            return {
                "connected": False,
                "latency_ms": round((time.time() - start) * 1000, 2),
                "message": f"Connection failed: {str(exc)}",
            }


transcription_service = GnaniTranscriptionService()
