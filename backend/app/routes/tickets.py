from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketNoteCreate,
    TicketNoteResponse,
    TicketHistoryResponse
)
from app.services.ticket_service import ticket_service
from app.security.auth import get_optional_current_user, get_current_user, require_admin

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def enrich_ticket_response(ticket, db: Session) -> TicketResponse:
    reporter_name = ticket.reporter.name if ticket.reporter else "Guest Reporter"
    assignee_name = ticket.assignee.name if ticket.assignee else None

    # Enrich history with actor names
    enriched_history = []
    for h in ticket.history:
        actor_name = h.actor.name if h.actor else "System / Reporter"
        enriched_history.append(
            TicketHistoryResponse(
                id=h.id,
                ticket_id=h.ticket_id,
                actor_id=h.actor_id,
                actor_name=actor_name,
                action=h.action,
                previous_value=h.previous_value,
                new_value=h.new_value,
                created_at=h.created_at
            )
        )

    # Enrich notes with author names
    enriched_notes = []
    for n in ticket.notes:
        author_name = n.author.name if n.author else "Internal Staff"
        enriched_notes.append(
            TicketNoteResponse(
                id=n.id,
                ticket_id=n.ticket_id,
                author_id=n.author_id,
                author_name=author_name,
                note=n.note,
                created_at=n.created_at
            )
        )

    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        reporter_id=ticket.reporter_id,
        reporter_name=reporter_name,
        title=ticket.title,
        description=ticket.description,
        transcript_original=ticket.transcript_original,
        transcript_reviewed=ticket.transcript_reviewed,
        category=ticket.category,
        location=ticket.location,
        priority=ticket.priority,
        status=ticket.status,
        assigned_to=ticket.assigned_to,
        assignee_name=assignee_name,
        resolution_notes=ticket.resolution_notes,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolved_at=ticket.resolved_at,
        history=enriched_history,
        notes=enriched_notes
    )


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Create a confirmed ticket from reviewed issue information.
    Generates a unique ticket number (e.g. VO-1001) and saves to database.
    """
    ticket = ticket_service.create_ticket(db, ticket_in, reporter=current_user)
    return enrich_ticket_response(ticket, db)


@router.get("", response_model=List[TicketResponse])
def list_tickets(
    status: Optional[str] = Query(None, description="Filter by status (Open, In Progress, Resolved, Closed, or All)"),
    category: Optional[str] = Query(None, description="Filter by category (Network, Hardware, Electrical, etc.)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High, Critical)"),
    search: Optional[str] = Query(None, description="Search query across ID, title, description, location"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve tickets with multi-criteria filtering and keyword search."""
    tickets, _ = ticket_service.list_tickets(
        db=db,
        status_filter=status,
        category_filter=category,
        priority_filter=priority,
        search_query=search,
        skip=skip,
        limit=limit
    )
    return [enrich_ticket_response(t, db) for t in tickets]


@router.get("/{id_or_number}", response_model=TicketResponse)
def get_ticket_details(id_or_number: str, db: Session = Depends(get_db)):
    """Retrieve full details of a single ticket by internal ID or ticket number (e.g. VO-1001)."""
    ticket = ticket_service.get_ticket_by_id_or_number(db, id_or_number)
    return enrich_ticket_response(ticket, db)


@router.patch("/{id_or_number}", response_model=TicketResponse)
def update_ticket_status_or_assignment(
    id_or_number: str,
    updates: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Update ticket status, priority, assignment, or resolution notes.
    Logs every state transition into the ticket audit history.
    """
    ticket = ticket_service.get_ticket_by_id_or_number(db, id_or_number)
    updated = ticket_service.update_ticket(db, ticket, updates, actor=current_user)
    return enrich_ticket_response(updated, db)


@router.post("/{id_or_number}/notes", response_model=TicketNoteResponse, status_code=status.HTTP_201_CREATED)
def add_internal_note(
    id_or_number: str,
    note_in: TicketNoteCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Add an internal note to a ticket."""
    ticket = ticket_service.get_ticket_by_id_or_number(db, id_or_number)
    note = ticket_service.add_note(db, ticket, note_in, author=current_user)
    return TicketNoteResponse(
        id=note.id,
        ticket_id=note.ticket_id,
        author_id=note.author_id,
        author_name=current_user.name if current_user else "Internal Staff",
        note=note.note,
        created_at=note.created_at
    )


@router.get("/{id_or_number}/history", response_model=List[TicketHistoryResponse])
def get_ticket_audit_history(id_or_number: str, db: Session = Depends(get_db)):
    """Retrieve chronological audit trail of all changes to this ticket."""
    ticket = ticket_service.get_ticket_by_id_or_number(db, id_or_number)
    history = []
    for h in ticket.history:
        actor_name = h.actor.name if h.actor else "System / Reporter"
        history.append(
            TicketHistoryResponse(
                id=h.id,
                ticket_id=h.ticket_id,
                actor_id=h.actor_id,
                actor_name=actor_name,
                action=h.action,
                previous_value=h.previous_value,
                new_value=h.new_value,
                created_at=h.created_at
            )
        )
    return history
