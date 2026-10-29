from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, status

from app.models.ticket import Ticket
from app.models.ticket_history import TicketHistory
from app.models.ticket_note import TicketNote
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketStatus, TicketNoteCreate


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
        reporter: Optional[User] = None
    ) -> Ticket:
        """Create a new ticket from confirmed reviewed details."""
        ticket_number = cls.generate_next_ticket_number(db)

        new_ticket = Ticket(
            ticket_number=ticket_number,
            reporter_id=reporter.id if reporter else None,
            title=ticket_in.title.strip(),
            description=ticket_in.description.strip(),
            transcript_original=ticket_in.transcript_original,
            transcript_reviewed=ticket_in.transcript_reviewed.strip(),
            category=ticket_in.category.value if hasattr(ticket_in.category, "value") else str(ticket_in.category),
            location=ticket_in.location.strip() if ticket_in.location else None,
            priority=ticket_in.priority.value if hasattr(ticket_in.priority, "value") else str(ticket_in.priority),
            status=TicketStatus.OPEN.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(new_ticket)
        db.flush()

        # Record history event
        history = TicketHistory(
            ticket_id=new_ticket.id,
            actor_id=reporter.id if reporter else None,
            action="created",
            new_value=f"Ticket created with initial status Open, priority {new_ticket.priority}"
        )
        db.add(history)
        db.commit()
        db.refresh(new_ticket)
        return new_ticket

    @staticmethod
    def get_ticket_by_id_or_number(db: Session, identifier: str) -> Ticket:
        """Find ticket by integer ID or ticket_number (e.g. VO-1001)."""
        query = db.query(Ticket)
        if identifier.isdigit():
            ticket = query.filter(Ticket.id == int(identifier)).first()
        else:
            ticket = query.filter(Ticket.ticket_number == identifier.upper()).first()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ticket '{identifier}' not found."
            )
        return ticket

    @staticmethod
    def list_tickets(
        db: Session,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Ticket], int]:
        """List tickets with multi-criteria filtering and keyword search."""
        query = db.query(Ticket)

        if status_filter and status_filter.lower() != "all":
            query = query.filter(Ticket.status.ilike(status_filter))

        if category_filter and category_filter.lower() != "all":
            query = query.filter(Ticket.category.ilike(category_filter))

        if priority_filter and priority_filter.lower() != "all":
            query = query.filter(Ticket.priority.ilike(priority_filter))

        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.filter(
                or_(
                    Ticket.ticket_number.ilike(term),
                    Ticket.title.ilike(term),
                    Ticket.description.ilike(term),
                    Ticket.location.ilike(term)
                )
            )

        total = query.count()
        tickets = query.order_by(desc(Ticket.created_at)).offset(skip).limit(limit).all()
        return tickets, total

    @staticmethod
    def update_ticket(
        db: Session,
        ticket: Ticket,
        updates: TicketUpdate,
        actor: Optional[User] = None
    ) -> Ticket:
        """Update ticket fields and log changes to audit history."""
        actor_id = actor.id if actor else None
        now = datetime.utcnow()

        # Status Change
        if updates.status and updates.status.value != ticket.status:
            old_status = ticket.status
            new_status = updates.status.value
            ticket.status = new_status
            if new_status in [TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value]:
                ticket.resolved_at = now
            elif old_status in [TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value]:
                ticket.resolved_at = None

            db.add(TicketHistory(
                ticket_id=ticket.id,
                actor_id=actor_id,
                action="status_changed",
                previous_value=old_status,
                new_value=new_status,
                created_at=now
            ))

        # Priority Change
        if updates.priority and updates.priority.value != ticket.priority:
            old_pri = ticket.priority
            new_pri = updates.priority.value
            ticket.priority = new_pri
            db.add(TicketHistory(
                ticket_id=ticket.id,
                actor_id=actor_id,
                action="priority_changed",
                previous_value=old_pri,
                new_value=new_pri,
                created_at=now
            ))

        # Assignment Change
        if updates.assigned_to is not None and updates.assigned_to != ticket.assigned_to:
            old_assignee = str(ticket.assigned_to or "Unassigned")
            ticket.assigned_to = updates.assigned_to
            db.add(TicketHistory(
                ticket_id=ticket.id,
                actor_id=actor_id,
                action="assigned",
                previous_value=old_assignee,
                new_value=str(updates.assigned_to or "Unassigned"),
                created_at=now
            ))

        # Field Updates
        if updates.title is not None:
            ticket.title = updates.title.strip()
        if updates.description is not None:
            ticket.description = updates.description.strip()
        if updates.category is not None:
            ticket.category = updates.category.value
        if updates.location is not None:
            ticket.location = updates.location.strip()
        if updates.resolution_notes is not None:
            ticket.resolution_notes = updates.resolution_notes.strip()

        ticket.updated_at = now
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def add_note(
        db: Session,
        ticket: Ticket,
        note_in: TicketNoteCreate,
        author: Optional[User] = None
    ) -> TicketNote:
        """Add an internal note to a ticket."""
        note = TicketNote(
            ticket_id=ticket.id,
            author_id=author.id if author else None,
            note=note_in.note.strip(),
            created_at=datetime.utcnow()
        )
        db.add(note)
        db.flush()

        db.add(TicketHistory(
            ticket_id=ticket.id,
            actor_id=author.id if author else None,
            action="note_added",
            new_value=f"Added internal note #{note.id}",
            created_at=datetime.utcnow()
        ))
        db.commit()
        db.refresh(note)
        return note


ticket_service = TicketService()
