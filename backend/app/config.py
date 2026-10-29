import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Database
    DATABASE_URL: str = "sqlite:///./voiceops.db"

    # Security
    SECRET_KEY: str = "voiceops-dev-secret-key-gnani-ai-challenge-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Gnani AI Configuration
    GNANI_MOCK_MODE: bool = False
    GNANI_API_KEY: str = ""
    GNANI_API_ENDPOINT: str = "https://api.vachana.ai/stt/v3"
    GNANI_LANGUAGE_CODE: str = "te-IN"

    # Information Extraction Component
    EXTRACTION_ENGINE: str = "rules"  # "rules", "gemini", "openai"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Audio limits
    MAX_AUDIO_FILE_SIZE_MB: int = 15
    MAX_AUDIO_DURATION_SECONDS: int = 120
    ALLOWED_AUDIO_EXTENSIONS: str = "wav,mp3,webm,ogg,m4a"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_audio_exts(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_AUDIO_EXTENSIONS.split(",") if ext.strip()]


settings = Settings()
