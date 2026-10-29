"""
Database Seeding Script for Supabase PostgreSQL.
Creates initial roles and realistic campus operational issue tickets.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from services.db import SessionLocal, User, Ticket, TicketHistory, TicketNote, init_db
from schemas.issues import TicketStatus, TicketCategory, TicketPriority


def seed_database():
    print("Initializing Supabase schema if tables do not exist...")
    init_db()

    db = SessionLocal()
    try:
        # 1. Seed Users if not present
        if db.query(User).count() == 0:
            print("Seeding initial users...")
            users = [
                User(
                    name="Campus IT Admin Desk",
                    email="admin@voiceops.internal",
                    password_hash="mock_hash_admin",
                    role="admin",
                ),
                User(
                    name="Rajesh Kumar (Field Tech)",
                    email="rajesh@voiceops.internal",
                    password_hash="mock_hash_tech",
                    role="technician",
                ),
                User(
                    name="Ravi Teja (Student)",
                    email="ravi@student.college.edu",
                    password_hash="mock_hash_student",
                    role="reporter",
                ),
            ]
            db.add_all(users)
            db.commit()
            print(f"Created {len(users)} users.")

        # 2. Seed Tickets if none exist
        if db.query(Ticket).count() == 0:
            print("Seeding initial operational tickets...")
            now = datetime.utcnow()
            tickets_data = [
                {
                    "num": "VO-1001",
                    "title": "Projector HDMI signal failure in Classroom Two",
                    "desc": "Projector will not power on and HDMI cable is loose, giving blue screen.",
                    "trans_orig": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
                    "trans_rev": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
                    "cat": TicketCategory.HARDWARE.value,
                    "loc": "Classroom Two",
                    "pri": TicketPriority.HIGH.value,
                    "stat": TicketStatus.IN_PROGRESS.value,
                    "created": now - timedelta(hours=14),
                },
                {
                    "num": "VO-1002",
                    "title": "Internet connectivity failure in Computer Lab 3",
                    "desc": "Internet connection has been down since morning, blocking student lab submissions.",
                    "trans_orig": "The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments.",
                    "trans_rev": "The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments.",
                    "cat": TicketCategory.NETWORK.value,
                    "loc": "Computer Lab 3",
                    "pri": TicketPriority.HIGH.value,
                    "stat": TicketStatus.OPEN.value,
                    "created": now - timedelta(hours=4),
                },
                {
                    "num": "VO-1003",
                    "title": "Electrical spark hazard on workbench four",
                    "desc": "Power socket sparking and tripping main circuit breaker.",
                    "trans_orig": "Power socket near electronics lab bench four is sparking and tripping the main circuit breaker.",
                    "trans_rev": "Power socket near electronics lab bench four is sparking and tripping the main circuit breaker.",
                    "cat": TicketCategory.ELECTRICAL.value,
                    "loc": "Electronics Lab Bench 4",
                    "pri": TicketPriority.CRITICAL.value,
                    "stat": TicketStatus.OPEN.value,
                    "created": now - timedelta(hours=50),  # SLA overdue
                },
                {
                    "num": "VO-1004",
                    "title": "Drinking water leakage on CSE 2nd floor",
                    "desc": "Water dispenser continuously leaking clean water onto corridor floor.",
                    "trans_orig": "Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor.",
                    "trans_rev": "Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor.",
                    "cat": TicketCategory.PLUMBING.value,
                    "loc": "CSE Department 2nd Floor",
                    "pri": TicketPriority.MEDIUM.value,
                    "stat": TicketStatus.RESOLVED.value,
                    "created": now - timedelta(hours=28),
                    "resolved": now - timedelta(hours=6),
                    "res_note": "Replaced faulty intake valve and dried floor area.",
                },
                {
                    "num": "VO-1005",
                    "title": "Air conditioner failing to cool Seminar Hall 1",
                    "desc": "AC compressor making rattling noise, room temperature is 32C.",
                    "trans_orig": "Seminar hall one air conditioner compressor making rattling noise and not cooling properly.",
                    "trans_rev": "Seminar hall one air conditioner compressor making rattling noise and not cooling properly.",
                    "cat": TicketCategory.FACILITIES.value,
                    "loc": "Seminar Hall 1",
                    "pri": TicketPriority.MEDIUM.value,
                    "stat": TicketStatus.CLOSED.value,
                    "created": now - timedelta(days=3),
                    "resolved": now - timedelta(days=2),
                    "res_note": "Cleaned air filters and refilled refrigerant gas.",
                },
            ]

            for td in tickets_data:
                t = Ticket(
                    ticket_number=td["num"],
                    reporter_name="Campus Evaluator",
                    title=td["title"],
                    description=td["desc"],
                    transcript_original=td["trans_orig"],
                    transcript_reviewed=td["trans_rev"],
                    category=td["cat"],
                    location=td["loc"],
                    priority=td["pri"],
                    status=td["stat"],
                    resolution_notes=td.get("res_note"),
                    created_at=td["created"],
                    updated_at=td.get("resolved", td["created"]),
                    resolved_at=td.get("resolved"),
                )
                db.add(t)
                db.flush()

                # Add history
                hist = TicketHistory(
                    ticket_id=t.id,
                    actor_name="System Seeder",
                    action="created",
                    new_value=f"Ticket initialized with status {t.status}",
                    created_at=td["created"],
                )
                db.add(hist)

            db.commit()
            print(f"Created {len(tickets_data)} operational tickets.")
        else:
            print(f"Supabase already contains {db.query(Ticket).count()} tickets.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
