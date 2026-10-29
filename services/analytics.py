"""
Real-time operational analytics calculated strictly from persistent database records.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.db import Ticket
from schemas.issues import TicketStatus


class AnalyticsService:
    @staticmethod
    def get_summary(db: Session, sla_hours: int = 48) -> Dict[str, Any]:
        """Calculate operational metrics from database."""
        total_tickets = db.query(Ticket).count()

        # Status counts
        status_rows = (
            db.query(Ticket.status, func.count(Ticket.id))
            .group_by(Ticket.status)
            .all()
        )
        status_map = {st: cnt for st, cnt in status_rows}

        open_cnt = status_map.get(TicketStatus.OPEN.value, 0)
        in_prog_cnt = status_map.get(TicketStatus.IN_PROGRESS.value, 0)
        resolved_cnt = status_map.get(TicketStatus.RESOLVED.value, 0)
        closed_cnt = status_map.get(TicketStatus.CLOSED.value, 0)

        # SLA Overdue calculation
        now = datetime.utcnow()
        sla_threshold = now - timedelta(hours=sla_hours)
        overdue_cnt = (
            db.query(Ticket)
            .filter(
                Ticket.status.in_([TicketStatus.OPEN.value, TicketStatus.IN_PROGRESS.value]),
                Ticket.created_at < sla_threshold,
            )
            .count()
        )

        # Average resolution time in hours
        resolved_tickets = (
            db.query(Ticket.created_at, Ticket.resolved_at)
            .filter(Ticket.resolved_at.isnot(None))
            .all()
        )
        avg_res_hours = 0.0
        if resolved_tickets:
            durations = [
                max((res - created).total_seconds() / 3600.0, 0.1)
                for created, res in resolved_tickets
                if res and created
            ]
            if durations:
                avg_res_hours = round(sum(durations) / len(durations), 1)

        # By Category
        cat_rows = (
            db.query(Ticket.category, func.count(Ticket.id))
            .group_by(Ticket.category)
            .all()
        )
        by_category = [{"category": c, "count": cnt} for c, cnt in cat_rows]

        # By Priority
        pri_rows = (
            db.query(Ticket.priority, func.count(Ticket.id))
            .group_by(Ticket.priority)
            .all()
        )
        by_priority = [{"priority": p, "count": cnt} for p, cnt in pri_rows]

        # By Top Locations
        loc_rows = (
            db.query(Ticket.location, func.count(Ticket.id))
            .filter(Ticket.location.isnot(None))
            .group_by(Ticket.location)
            .order_by(func.count(Ticket.id).desc())
            .limit(6)
            .all()
        )
        by_location = [{"location": l, "count": cnt} for l, cnt in loc_rows]

        # 7-day trend
        seven_days_ago = now - timedelta(days=7)
        recent_created = (
            db.query(Ticket.created_at)
            .filter(Ticket.created_at >= seven_days_ago)
            .all()
        )
        trend_map: Dict[str, int] = {}
        for i in range(7):
            d_str = (seven_days_ago + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            trend_map[d_str] = 0

        for r in recent_created:
            if r[0]:
                d_str = r[0].strftime("%Y-%m-%d")
                if d_str in trend_map:
                    trend_map[d_str] += 1

        trend_over_time = [{"date": k, "count": v} for k, v in trend_map.items()]

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_cnt,
            "in_progress_tickets": in_prog_cnt,
            "resolved_tickets": resolved_cnt,
            "closed_tickets": closed_cnt,
            "overdue_tickets": overdue_cnt,
            "sla_target_hours": sla_hours,
            "avg_resolution_hours": avg_res_hours,
            "by_category": by_category,
            "by_priority": by_priority,
            "by_location": by_location,
            "trend_over_time": trend_over_time,
        }


analytics_service = AnalyticsService()
