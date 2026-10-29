from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "VO-1001"
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    transcript_original = Column(Text, nullable=True)
    transcript_reviewed = Column(Text, nullable=False)
    
    category = Column(String(50), nullable=False, default="General")  # Network, Hardware, Electrical, Plumbing, Facility, Other
    location = Column(String(150), nullable=True)
    priority = Column(String(50), nullable=False, default="Medium")  # Low, Medium, High, Critical
    status = Column(String(50), nullable=False, default="Open")  # Open, In Progress, Resolved, Closed
    
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tickets")
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketHistory.created_at.desc()")
    notes = relationship("TicketNote", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketNote.created_at.desc()")
