"""
Unit tests for Operational Analytics Service (services/analytics.py).
Tests real database aggregations, zero-state safety, and SLA overdue thresholds.
"""

from datetime import datetime, timedelta
from services.analytics import AnalyticsService
from services.db import Ticket
from schemas.issues import TicketStatus


def test_analytics_empty_database_zero_state(in_memory_db):
    """Verify that an empty database returns clean zero metrics with no division-by-zero errors."""
    summary = AnalyticsService.get_summary(in_memory_db, sla_hours=48)

    assert summary["total_tickets"] == 0
    assert summary["open_tickets"] == 0
    assert summary["in_progress_tickets"] == 0
    assert summary["resolved_tickets"] == 0
    assert summary["closed_tickets"] == 0
    assert summary["overdue_tickets"] == 0
    assert summary["avg_resolution_hours"] == 0.0
    assert isinstance(summary["by_category"], list)
    assert isinstance(summary["by_priority"], list)
    assert isinstance(summary["trend_over_time"], list)
    assert len(summary["trend_over_time"]) == 7


def test_analytics_calculated_from_db_records(in_memory_db):
    """Verify real aggregations of status, category, priority, and SLA overdue calculations."""
    now = datetime.utcnow()

    # 1. Normal Open Ticket (recent, within SLA)
    t1 = Ticket(
        ticket_number="VO-1001",
        title="Wi-Fi down",
        description="Wi-Fi down",
        transcript_reviewed="Wi-Fi down",
        category="Network",
        priority="High",
        status=TicketStatus.OPEN.value,
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2),
    )
    # 2. Overdue Open Ticket (created 60h ago, SLA is 48h)
    t2 = Ticket(
        ticket_number="VO-1002",
        title="Ceiling pipe leak",
        description="Ceiling pipe leak",
        transcript_reviewed="Ceiling pipe leak",
        category="Plumbing",
        priority="Critical",
        status=TicketStatus.OPEN.value,
        created_at=now - timedelta(hours=60),
        updated_at=now - timedelta(hours=60),
    )
    # 3. Resolved Ticket (created 10h ago, resolved 6h ago -> resolution time 4h)
    t3 = Ticket(
        ticket_number="VO-1003",
        title="Keyboard replacement",
        description="Keyboard replacement",
        transcript_reviewed="Keyboard replacement",
        category="Hardware",
        priority="Low",
        status=TicketStatus.RESOLVED.value,
        created_at=now - timedelta(hours=10),
        resolved_at=now - timedelta(hours=6),
        updated_at=now - timedelta(hours=6),
    )

    in_memory_db.add_all([t1, t2, t3])
    in_memory_db.commit()

    summary = AnalyticsService.get_summary(in_memory_db, sla_hours=48)

    assert summary["total_tickets"] == 3
    assert summary["open_tickets"] == 2
    assert summary["resolved_tickets"] == 1
    assert summary["overdue_tickets"] == 1  # Only t2 is older than 48h
    assert summary["avg_resolution_hours"] == 4.0  # (10 - 6) = 4 hours

    categories = {c["category"]: c["count"] for c in summary["by_category"]}
    assert categories["Network"] == 1
    assert categories["Plumbing"] == 1
    assert categories["Hardware"] == 1
