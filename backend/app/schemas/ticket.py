from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class TicketCategory(str, Enum):
    NETWORK = "Network"
    HARDWARE = "Hardware"
    ELECTRICAL = "Electrical"
    PLUMBING = "Plumbing"
    FACILITY = "Facility"
    OTHER = "Other"


class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


# --- Ticket Notes ---
class TicketNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=2000)


class TicketNoteResponse(BaseModel):
    id: int
    ticket_id: int
    author_id: Optional[int]
    author_name: Optional[str] = None
    note: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Ticket History ---
class TicketHistoryResponse(BaseModel):
    id: int
    ticket_id: int
    actor_id: Optional[int]
    actor_name: Optional[str] = None
    action: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Ticket Core ---
class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    transcript_original: Optional[str] = None
    transcript_reviewed: str = Field(..., min_length=3)
    category: TicketCategory = TicketCategory.OTHER
    location: Optional[str] = Field(None, max_length=150)
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    category: Optional[TicketCategory] = None
    location: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    reporter_id: Optional[int]
    reporter_name: Optional[str] = None
    title: str
    description: str
    transcript_original: Optional[str]
    transcript_reviewed: str
    category: str
    location: Optional[str]
    priority: str
    status: str
    assigned_to: Optional[int]
    assignee_name: Optional[str] = None
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    history: List[TicketHistoryResponse] = []
    notes: List[TicketNoteResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- Issue Extraction (FR-04) ---
class IssueExtractionRequest(BaseModel):
    transcript_reviewed: str = Field(..., min_length=3, description="User reviewed transcript text")
    language: Optional[str] = Field("te-IN", description="Language code")


class IssueExtractionResponse(BaseModel):
    title: str
    description: str
    category: TicketCategory
    location: Optional[str] = None
    priority: TicketPriority
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    missing_fields: List[str] = []
    reasoning: Optional[str] = None
