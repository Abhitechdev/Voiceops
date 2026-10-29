"""
Supabase PostgreSQL service wrapper.
"""

from typing import Dict, Any, List
from sqlalchemy import text
from services.db import engine, get_db, Ticket, User, TicketHistory, TicketNote


class SupabaseService:
    @staticmethod
    def get_connection_info() -> Dict[str, Any]:
        """Return non-sensitive database connection diagnostics."""
        dialect = engine.dialect.name
        is_postgres = dialect.startswith("postgres")
        host = engine.url.host or "localhost"
        return {
            "provider": "Supabase PostgreSQL" if is_postgres else "Local SQLite",
            "dialect": dialect,
            "host": host,
            "port": engine.url.port or 5432,
            "database": engine.url.database or "postgres",
        }

    @staticmethod
    def get_table_counts() -> Dict[str, int]:
        """Fetch total record count across core tables."""
        counts = {"tickets": 0, "users": 0, "history": 0, "notes": 0}
        try:
            with engine.connect() as conn:
                counts["tickets"] = conn.execute(text("SELECT count(*) FROM tickets;")).scalar() or 0
                counts["users"] = conn.execute(text("SELECT count(*) FROM users;")).scalar() or 0
                counts["history"] = conn.execute(text("SELECT count(*) FROM ticket_history;")).scalar() or 0
                counts["notes"] = conn.execute(text("SELECT count(*) FROM ticket_notes;")).scalar() or 0
        except Exception:
            pass
        return counts


supabase_service = SupabaseService()

