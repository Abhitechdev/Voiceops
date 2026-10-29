from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_history import TicketHistory
from app.models.ticket_note import TicketNote
from app.security.auth import get_password_hash


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_tickets = db.query(Ticket).count()
        if existing_tickets > 0:
            print(f"Database already contains {existing_tickets} tickets. Skipping seed.")
            return

        print("Seeding initial users and operational campus tickets...")

        # 1. Users (fetch or create)
        admin = db.query(User).filter(User.email == "admin@voiceops.internal").first()
        if not admin:
            admin = User(
                name="Priya Sharma (IT Admin)",
                email="admin@voiceops.internal",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.flush()

        tech_rajesh = db.query(User).filter(User.email == "rajesh@voiceops.internal").first()
        if not tech_rajesh:
            tech_rajesh = User(
                name="Rajesh Kumar (Network Engineer)",
                email="rajesh@voiceops.internal",
                password_hash=get_password_hash("tech123"),
                role="admin"
            )
            db.add(tech_rajesh)
            db.flush()

        student_ravi = db.query(User).filter(User.email == "ravi@student.college.edu").first()
        if not student_ravi:
            student_ravi = User(
                name="Ravi Teja (Student CSE)",
                email="ravi@student.college.edu",
                password_hash=get_password_hash("ravi123"),
                role="reporter"
            )
            db.add(student_ravi)
            db.flush()

        db.commit()

        now = datetime.utcnow()

        # 2. Seed Tickets
        seed_tickets_data = [
            {
                "num": "VO-1001",
                "title": "Internet connectivity failure in Computer Lab 3",
                "desc": "The computer lab 3 internet has not been working since morning, students cannot submit their lab assignments.",
                "orig": "computer lab three lo internet pani cheyyatledu",
                "rev": "The computer lab 3 internet has not been working since morning, students cannot submit their lab assignments.",
                "cat": "Network",
                "loc": "Computer Lab 3",
                "pri": "High",
                "status": "In Progress",
                "age_hours": 18,
                "assigned": tech_rajesh.id,
                "note": "Technician testing the Cisco core switch on rack 2.",
                "hist": [
                    ("created", "Created via voice report (Telugu-English code-mixed)"),
                    ("assigned", f"Assigned to {tech_rajesh.name}"),
                    ("status_changed", "Status changed to In Progress")
                ]
            },
            {
                "num": "VO-1002",
                "title": "Projector display failure in Classroom Two",
                "desc": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
                "orig": "classroom two lo projector switch on avvatledu hdmi loose ga undi",
                "rev": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
                "cat": "Hardware",
                "loc": "Classroom Two",
                "pri": "High",
                "status": "Open",
                "age_hours": 3,
                "assigned": None,
                "note": None,
                "hist": [
                    ("created", "Reported by faculty member via voice")
                ]
            },
            {
                "num": "VO-1003",
                "title": "Electrical spark / power fault near Workbench Four",
                "desc": "Power socket near electronics lab bench four is sparking and tripping the main circuit breaker.",
                "orig": "electronics lab bench four lo socket spark vastondi breaker trip aindi",
                "rev": "Power socket near electronics lab bench four is sparking and tripping the main circuit breaker.",
                "cat": "Electrical",
                "loc": "Electronics Lab Bench Four",
                "pri": "Critical",
                "status": "Resolved",
                "age_hours": 36,
                "resolved_hours": 32,
                "assigned": tech_rajesh.id,
                "res_note": "Replaced burned 16A socket and reset 32A MCB. Safe to operate.",
                "note": "Immediate electrical hazard addressed safely.",
                "hist": [
                    ("created", "Critical safety report flagged"),
                    ("assigned", f"Dispatched {tech_rajesh.name}"),
                    ("status_changed", "Status changed to In Progress"),
                    ("status_changed", "Status changed to Resolved")
                ]
            },
            {
                "num": "VO-1004",
                "title": "Water leakage in CSE Block 2nd Floor",
                "desc": "Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor.",
                "orig": "cse block 2nd floor lo water cooler leak avtundi",
                "rev": "Water dispenser on the second floor of the CSE department is leaking clean water continuously onto the corridor floor.",
                "cat": "Plumbing",
                "loc": "CSE Block 2nd Floor",
                "pri": "Medium",
                "status": "Resolved",
                "age_hours": 50,
                "resolved_hours": 46,
                "assigned": None,
                "res_note": "Plumbing contractor tightened the inlet brass valve and replaced Teflon seal.",
                "note": "Flooring dried, slip hazard cleared.",
                "hist": [
                    ("created", "Reported by student"),
                    ("status_changed", "Resolved by facility team")
                ]
            },
            {
                "num": "VO-1005",
                "title": "Broken bench hinge in Seminar Hall A",
                "desc": "Row 4 middle bench wooden support is cracked and wobbles dangerously when students sit.",
                "orig": "seminar hall A bench broken",
                "rev": "Row 4 middle bench wooden support in Seminar Hall A is cracked and wobbles dangerously.",
                "cat": "Facility",
                "loc": "Seminar Hall A",
                "pri": "Low",
                "status": "Open",
                "age_hours": 8,
                "assigned": None,
                "note": None,
                "hist": [
                    ("created", "Logged for routine maintenance")
                ]
            }
        ]

        for item in seed_tickets_data:
            created_time = now - timedelta(hours=item["age_hours"])
            resolved_time = (now - timedelta(hours=item["resolved_hours"])) if "resolved_hours" in item else None

            ticket = Ticket(
                ticket_number=item["num"],
                reporter_id=student_ravi.id,
                title=item["title"],
                description=item["desc"],
                transcript_original=item["orig"],
                transcript_reviewed=item["rev"],
                category=item["cat"],
                location=item["loc"],
                priority=item["pri"],
                status=item["status"],
                assigned_to=item.get("assigned"),
                resolution_notes=item.get("res_note"),
                created_at=created_time,
                updated_at=now,
                resolved_at=resolved_time
            )
            db.add(ticket)
            db.flush()

            for act, val in item["hist"]:
                db.add(TicketHistory(
                    ticket_id=ticket.id,
                    actor_id=admin.id,
                    action=act,
                    new_value=val,
                    created_at=created_time + timedelta(minutes=15)
                ))

            if item.get("note"):
                db.add(TicketNote(
                    ticket_id=ticket.id,
                    author_id=admin.id,
                    note=item["note"],
                    created_at=created_time + timedelta(minutes=30)
                ))

        db.commit()
        print("Successfully seeded 5 realistic tickets and users into database!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
