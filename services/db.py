"""
Database service connecting to Supabase PostgreSQL with automated SQLite fallback.
"""

import os
from datetime import datetime
from typing import Generator, Optional
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from dotenv import load_dotenv
from schemas.issues import TicketStatus, TicketCategory, TicketPriority

load_dotenv()

# Fetch DATABASE_URL or build from Supabase params
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voiceops.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Initialize SQLAlchemy engine with connection pool pre-ping
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ==============================================================================
# Model Definitions
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="reporter")
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="reporter", foreign_keys="Ticket.reporter_id")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_number = Column(String(30), unique=True, nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_name = Column(String(120), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    transcript_original = Column(Text, nullable=True)
    transcript_reviewed = Column(Text, nullable=False)
    category = Column(String(60), nullable=False, index=True)
    location = Column(String(150), nullable=True, index=True)
    priority = Column(String(30), nullable=False, default="Medium", index=True)
    status = Column(String(30), nullable=False, default="Open", index=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assignee_name = Column(String(120), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", back_populates="tickets", foreign_keys=[reporter_id])
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan", order_by="desc(TicketHistory.created_at)")
    notes = relationship("TicketNote", back_populates="ticket", cascade="all, delete-orphan", order_by="desc(TicketNote.created_at)")


class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String(120), nullable=True)
    action = Column(String(80), nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    ticket = relationship("Ticket", back_populates="history")


class TicketNote(Base):
    __tablename__ = "ticket_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, nullable=True)
    author_name = Column(String(120), nullable=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    ticket = relationship("Ticket", back_populates="notes")

    @property
    def note_text(self) -> str:
        return self.note


def init_db():
    """Ensure database tables exist on target database."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Yield database session with guaranteed closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """Test live connectivity and latency to database."""
    import time
    start = time.time()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        latency_ms = round((time.time() - start) * 1000, 2)
        dialect = engine.dialect.name
        return {
            "status": "healthy",
            "dialect": dialect,
            "latency_ms": latency_ms,
            "connected": True,
        }
    except Exception as exc:
        return {
            "status": "error",
            "error": str(exc),
            "connected": False,
        }
