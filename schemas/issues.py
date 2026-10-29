"""
Pydantic schemas and enums for VoiceOps issue reporting and management.
"""

from enum import Enum
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class TicketCategory(str, Enum):
    NETWORK = "Network"
    HARDWARE = "Hardware"
    SOFTWARE = "Software"
    ELECTRICAL = "Electrical"
    PLUMBING = "Plumbing"
    FACILITIES = "Facilities"
    OTHER = "Other"

    @classmethod
    def from_string(cls, val: str) -> "TicketCategory":
        val_clean = str(val).strip().lower()
        mapping = {
            "network": cls.NETWORK,
            "internet": cls.NETWORK,
            "wifi": cls.NETWORK,
            "lan": cls.NETWORK,
            "hardware": cls.HARDWARE,
            "software": cls.SOFTWARE,
            "electrical": cls.ELECTRICAL,
            "power": cls.ELECTRICAL,
            "plumbing": cls.PLUMBING,
            "water": cls.PLUMBING,
            "facilities": cls.FACILITIES,
            "facility": cls.FACILITIES,
        }
        return mapping.get(val_clean, cls.OTHER)


class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

    @classmethod
    def from_string(cls, val: str) -> "TicketPriority":
        val_clean = str(val).strip().capitalize()
        for pri in cls:
            if pri.value == val_clean:
                return pri
        return cls.MEDIUM


class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class IssueExtractionResult(BaseModel):
    title: str = Field(..., max_length=150, description="Concise summary of the problem")
    description: str = Field(..., description="Full description of the incident")
    category: str = Field(default="Other")
    location: Optional[str] = Field(default=None, description="Campus room, lab, or building")
    priority: str = Field(default="Medium")
    asset_id: Optional[str] = Field(default=None, description="Optional equipment identifier")
    missing_fields: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    reasoning: Optional[str] = None


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    transcript_original: Optional[str] = None
    transcript_reviewed: str = Field(..., min_length=3)
    category: str = Field(default="Other")
    location: Optional[str] = None
    priority: str = Field(default="Medium")
    asset_id: Optional[str] = None

    @field_validator("title", "description", "transcript_reviewed")
    @classmethod
    def not_empty_whitespace(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or purely whitespace.")
        return v.strip()


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    assignee_name: Optional[str] = None
    resolution_notes: Optional[str] = None


class TicketNoteCreate(BaseModel):
    note: str = Field(..., min_length=1)
    author_name: Optional[str] = "Field Technician"
