from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ticket import Ticket
from app.schemas.ticket import TicketStatus


class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(db: Session, sla_hours: int = 48) -> Dict[str, Any]:
        """
        Calculate live analytics strictly from database records.
        Handles zero-state gracefully without artificial hardcoded demo values.
        """
        total_tickets = db.query(Ticket).count()

        # Status counts
        status_counts_raw = (
            db.query(Ticket.status, func.count(Ticket.id))
            .group_by(Ticket.status)
            .all()
        )
        status_counts = {status: count for status, count in status_counts_raw}

        open_count = status_counts.get(TicketStatus.OPEN.value, 0)
        in_progress_count = status_counts.get(TicketStatus.IN_PROGRESS.value, 0)
        resolved_count = status_counts.get(TicketStatus.RESOLVED.value, 0)
        closed_count = status_counts.get(TicketStatus.CLOSED.value, 0)

        # Category distribution
        category_counts_raw = (
            db.query(Ticket.category, func.count(Ticket.id))
            .group_by(Ticket.category)
            .all()
        )
        by_category = [{"category": cat, "count": count} for cat, count in category_counts_raw]

        # Priority distribution
        priority_counts_raw = (
            db.query(Ticket.priority, func.count(Ticket.id))
            .group_by(Ticket.priority)
            .all()
        )
        by_priority = [{"priority": pri, "count": count} for pri, count in priority_counts_raw]

        # Location distribution (top 6 locations)
        location_counts_raw = (
            db.query(Ticket.location, func.count(Ticket.id))
            .filter(Ticket.location.isnot(None))
            .group_by(Ticket.location)
            .order_by(func.count(Ticket.id).desc())
            .limit(6)
            .all()
        )
        by_location = [{"location": loc, "count": count} for loc, count in location_counts_raw]

        # Tickets created over the last 7 days
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        recent_tickets = (
            db.query(Ticket.created_at)
            .filter(Ticket.created_at >= seven_days_ago)
            .all()
        )

        # Bucket by day (YYYY-MM-DD)
        trend_buckets: Dict[str, int] = {}
        for i in range(7):
            day_str = (seven_days_ago + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            trend_buckets[day_str] = 0

        for t in recent_tickets:
            day_str = t.created_at.strftime("%Y-%m-%d")
            if day_str in trend_buckets:
                trend_buckets[day_str] += 1

        trend_over_time = [{"date": k, "count": v} for k, v in trend_buckets.items()]

        # Average resolution time in hours
        resolved_tickets = (
            db.query(Ticket)
            .filter(Ticket.resolved_at.isnot(None))
            .all()
        )

        avg_resolution_hours = 0.0
        if resolved_tickets:
            total_duration_hours = sum(
                (t.resolved_at - t.created_at).total_seconds() / 3600.0
                for t in resolved_tickets
                if t.resolved_at >= t.created_at
            )
            avg_resolution_hours = round(total_duration_hours / len(resolved_tickets), 1)

        # Overdue tickets calculation (Open/In Progress past SLA target)
        sla_threshold = now - timedelta(hours=sla_hours)
        overdue_count = (
            db.query(Ticket)
            .filter(
                Ticket.status.in_([TicketStatus.OPEN.value, TicketStatus.IN_PROGRESS.value]),
                Ticket.created_at < sla_threshold
            )
            .count()
        )

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_count,
            "in_progress_tickets": in_progress_count,
            "resolved_tickets": resolved_count,
            "closed_tickets": closed_count,
            "overdue_tickets": overdue_count,
            "avg_resolution_hours": avg_resolution_hours,
            "by_category": by_category,
            "by_priority": by_priority,
            "by_location": by_location,
            "trend_over_time": trend_over_time,
            "sla_target_hours": sla_hours
        }


analytics_service = AnalyticsService()
