from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.security.auth import get_password_hash
from app.routes import auth, transcriptions, issues, tickets, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if not existing
    Base.metadata.create_all(bind=engine)

    # Seed default administrator if not present
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@voiceops.internal").first()
        if not admin:
            default_admin = User(
                name="Campus IT Admin",
                email="admin@voiceops.internal",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(default_admin)
            db.commit()
    finally:
        db.close()

    yield


app = FastAPI(
    title="VoiceOps API",
    version="1.0.0",
    description="Voice-First Issue Reporting and Management System (Gnani AI STT Integration)",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(transcriptions.router)
app.include_router(issues.router)
app.include_router(tickets.router)
app.include_router(analytics.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Application health and configuration status endpoint."""
    return {
        "status": "healthy",
        "service": "VoiceOps API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "gnani_mock_mode": settings.GNANI_MOCK_MODE,
        "extraction_engine": settings.EXTRACTION_ENGINE,
        "database": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    }
