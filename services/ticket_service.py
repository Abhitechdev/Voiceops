"""
Persistent ticket management service with sequential IDs, idempotency, audit trail, and filtering.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from services.db import Ticket, TicketHistory, TicketNote, User, get_db
from schemas.issues import TicketCreate, TicketUpdate, TicketStatus, TicketCategory, TicketPriority


class TicketService:
    @staticmethod
    def generate_next_ticket_number(db: Session) -> str:
        """Generate human-readable sequential ticket number (e.g. VO-1001)."""
        last_ticket = db.query(Ticket).order_by(Ticket.id.desc()).first()
        if not last_ticket:
            return "VO-1001"
        try:
            current_num = int(last_ticket.ticket_number.split("-")[1])
            return f"VO-{current_num + 1}"
        except (IndexError, ValueError):
            return f"VO-{1000 + last_ticket.id + 1}"

    @classmethod
    def create_ticket(
        cls,
        db: Session,
        ticket_in: TicketCreate,
        reporter_name: Optional[str] = "Campus Reporter",
        reporter_id: Optional[int] = None,
    ) -> Ticket:
        """
        Create a new persistent ticket with idempotency check to prevent rapid double-clicks.
        """
        # Idempotency check: Reject duplicate submission if identical title was created in last 90 seconds
        recent_window = datetime.utcnow() - timedelta(seconds=90)
        duplicate = (
            db.query(Ticket)
            .filter(
                Ticket.title == ticket_in.title.strip(),
                Ticket.created_at >= recent_window,
            )
            .first()
        )
        if duplicate:
            return duplicate

        ticket_number = cls.generate_next_ticket_number(db)
        category_str = TicketCategory.from_string(ticket_in.category).value
        priority_str = TicketPriority.from_string(ticket_in.priority).value

        new_ticket = Ticket(
            ticket_number=ticket_number,
            reporter_id=reporter_id,
            reporter_name=reporter_name,
            title=ticket_in.title.strip(),
            description=ticket_in.description.strip(),
            transcript_original=ticket_in.transcript_original,
            transcript_reviewed=ticket_in.transcript_reviewed.strip(),
            category=category_str,
            location=ticket_in.location.strip() if ticket_in.location else None,
            priority=priority_str,
            status=TicketStatus.OPEN.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(new_ticket)
        db.flush()

        # Audit History Record
        history = TicketHistory(
            ticket_id=new_ticket.id,
            actor_name=reporter_name,
            action="created",
            new_value=f"Ticket initialized with status 'Open' and priority '{priority_str}'.",
        )
        db.add(history)
        db.commit()
        db.refresh(new_ticket)
        return new_ticket

    @staticmethod
    def get_ticket(db: Session, identifier: str) -> Optional[Ticket]:
        """Lookup ticket by ticket_number (VO-1001) or primary key ID."""
        ident_clean = str(identifier).strip().upper()
        if ident_clean.isdigit():
            return db.query(Ticket).filter(Ticket.id == int(ident_clean)).first()
        return db.query(Ticket).filter(Ticket.ticket_number == ident_clean).first()

    @staticmethod
    def list_tickets(
        db: Session,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> List[Ticket]:
        """Search and filter tickets with multi-field matching."""
        query = db.query(Ticket)

        if status and status.lower() != "all":
            query = query.filter(Ticket.status.ilike(status))

        if category and category.lower() != "all":
            query = query.filter(Ticket.category.ilike(category))

        if priority and priority.lower() != "all":
            query = query.filter(Ticket.priority.ilike(priority))

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Ticket.ticket_number.ilike(term),
                    Ticket.title.ilike(term),
                    Ticket.description.ilike(term),
                    Ticket.location.ilike(term),
                    Ticket.transcript_reviewed.ilike(term),
                )
            )

        return query.order_by(desc(Ticket.created_at)).limit(limit).all()

    @staticmethod
    def update_ticket_status(
        db: Session,
        ticket_number: str,
        new_status: str,
        resolution_notes: Optional[str] = None,
        actor_name: str = "Administrator",
    ) -> Ticket:
        """Update ticket operational status and append resolution note."""
        ticket = TicketService.get_ticket(db, ticket_number)
        if not ticket:
            raise ValueError(f"Ticket '{ticket_number}' not found.")

        old_status = ticket.status
        ticket.status = new_status
        ticket.updated_at = datetime.utcnow()

        if new_status == TicketStatus.RESOLVED.value and not ticket.resolved_at:
            ticket.resolved_at = datetime.utcnow()

        if resolution_notes and resolution_notes.strip():
            ticket.resolution_notes = resolution_notes.strip()

        # Audit History Record
        history = TicketHistory(
            ticket_id=ticket.id,
            actor_name=actor_name,
            action="status_change",
            previous_value=old_status,
            new_value=f"Status changed to {new_status}. Note: {resolution_notes or 'None'}",
        )
        db.add(history)
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def add_note(
        db: Session,
        ticket_number_or_id: Any = None,
        note_text: str = "",
        author_name: str = "Field Technician",
        ticket_id: Any = None,
    ) -> TicketNote:
        """Append an internal technician observation note to the ticket."""
        ident = ticket_id if ticket_id is not None else ticket_number_or_id
        ticket = TicketService.get_ticket(db, str(ident))
        if not ticket:
            raise ValueError(f"Ticket '{ident}' not found.")

        note = TicketNote(
            ticket_id=ticket.id,
            author_name=author_name,
            note=note_text.strip(),
            created_at=datetime.utcnow(),
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    add_internal_note = add_note

    @staticmethod
    def get_ticket_history(db: Session, ticket_id: int) -> List[TicketHistory]:
        """Fetch audit log history for a ticket."""
        return (
            db.query(TicketHistory)
            .filter(TicketHistory.ticket_id == ticket_id)
            .order_by(desc(TicketHistory.created_at))
            .all()
        )

    @staticmethod
    def get_ticket_notes(db: Session, ticket_id: int) -> List[TicketNote]:
        """Fetch internal technician notes for a ticket."""
        return (
            db.query(TicketNote)
            .filter(TicketNote.ticket_id == ticket_id)
            .order_by(desc(TicketNote.created_at))
            .all()
        )


ticket_service = TicketService()
