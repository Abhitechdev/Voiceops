"""
Unit tests for Ticket Management Service (services/ticket_service.py).
Tests ticket creation validation, duplicate detection, sequential ID generation, status transitions, and search.
"""

import pytest
from pydantic import ValidationError
from schemas.issues import TicketCreate, TicketStatus, TicketCategory, TicketPriority
from services.ticket_service import TicketService


def test_ticket_create_validation_empty_title():
    with pytest.raises(ValidationError):
        TicketCreate(
            title="",  # Empty string rejected by validator
            description="Some description here",
            transcript_reviewed="Some transcript",
            category="Network",
            priority="High",
        )


def test_sequential_ticket_id_generation(in_memory_db):
    first_id = TicketService.generate_next_ticket_number(in_memory_db)
    assert first_id == "VO-1001"

    t1_in = TicketCreate(
        title="First Campus Issue",
        description="Wi-Fi is down in Block A",
        transcript_reviewed="Wi-Fi is down in Block A",
        category="Network",
        location="Block A",
        priority="High",
    )
    t1 = TicketService.create_ticket(in_memory_db, t1_in)
    assert t1.ticket_number == "VO-1001"

    second_id = TicketService.generate_next_ticket_number(in_memory_db)
    assert second_id == "VO-1002"

    t2_in = TicketCreate(
        title="Second Campus Issue",
        description="Water tap is broken",
        transcript_reviewed="Water tap is broken",
        category="Plumbing",
        location="Hostel 2",
        priority="Medium",
    )
    t2 = TicketService.create_ticket(in_memory_db, t2_in)
    assert t2.ticket_number == "VO-1002"


def test_idempotent_duplicate_prevention(in_memory_db):
    t_in = TicketCreate(
        title="Identical Duplicate Title Issue",
        description="Description one",
        transcript_reviewed="Description one",
        category="Hardware",
        location="Lab 1",
        priority="Low",
    )
    created1 = TicketService.create_ticket(in_memory_db, t_in)
    created2 = TicketService.create_ticket(in_memory_db, t_in)

    # Must return the existing ticket rather than creating a new ticket with a new number
    assert created1.id == created2.id
    assert created1.ticket_number == created2.ticket_number


def test_ticket_status_lifecycle_and_audit(in_memory_db):
    t_in = TicketCreate(
        title="Projector in Seminar Hall 1 Not Working",
        description="Projector HDMI has no signal",
        transcript_reviewed="Projector HDMI has no signal",
        category="Hardware",
        location="Seminar Hall 1",
        priority="High",
    )
    t = TicketService.create_ticket(in_memory_db, t_in)
    assert t.status == TicketStatus.OPEN.value

    # Update to In Progress
    updated = TicketService.update_ticket_status(
        in_memory_db,
        ticket_number=t.ticket_number,
        new_status="In Progress",
        actor_name="Technician Rajesh",
    )
    assert updated.status == "In Progress"

    # Update to Resolved with resolution note
    resolved = TicketService.update_ticket_status(
        in_memory_db,
        ticket_number=t.ticket_number,
        new_status="Resolved",
        resolution_notes="Replaced faulty HDMI switch and verified 1080p display output.",
        actor_name="Technician Rajesh",
    )
    assert resolved.status == "Resolved"
    assert resolved.resolution_notes == "Replaced faulty HDMI switch and verified 1080p display output."
    assert resolved.resolved_at is not None

    # Check audit history
    history = TicketService.get_ticket_history(in_memory_db, t.id)
    assert len(history) >= 3  # created, in progress, resolved


def test_ticket_internal_note_creation(in_memory_db):
    t_in = TicketCreate(
        title="Server Rack Temperature Alert",
        description="Rack 2 temperature sensor reading 42C",
        transcript_reviewed="Rack 2 temperature reading 42C",
        category="Facilities",
        location="Server Room",
        priority="Critical",
    )
    t = TicketService.create_ticket(in_memory_db, t_in)

    note = TicketService.add_internal_note(
        in_memory_db,
        ticket_id=t.id,
        note_text="Dispatched AC maintenance team to check secondary cooling fan.",
        author_name="Ops Lead Ananya",
    )
    assert note.id is not None
    assert "AC maintenance team" in note.note_text

    notes = TicketService.get_ticket_notes(in_memory_db, t.id)
    assert len(notes) == 1
    assert notes[0].author_name == "Ops Lead Ananya"


def test_ticket_search_and_filters(in_memory_db):
    t1 = TicketService.create_ticket(
        in_memory_db,
        TicketCreate(
            title="Lab 3 Network Outage",
            description="Ethernet ports down",
            transcript_reviewed="Ethernet ports down",
            category="Network",
            location="Lab 3",
            priority="Critical",
        ),
    )
    t2 = TicketService.create_ticket(
        in_memory_db,
        TicketCreate(
            title="Cafeteria Water Leakage",
            description="Sink tap leaking",
            transcript_reviewed="Sink tap leaking",
            category="Plumbing",
            location="Cafeteria",
            priority="Low",
        ),
    )

    # Filter by category
    network_tickets = TicketService.list_tickets(in_memory_db, category="Network")
    assert len(network_tickets) == 1
    assert network_tickets[0].title == "Lab 3 Network Outage"

    # Search free text
    search_res = TicketService.list_tickets(in_memory_db, search="Cafeteria")
    assert len(search_res) == 1
    assert search_res[0].title == "Cafeteria Water Leakage"
