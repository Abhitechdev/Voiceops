"""
Test configuration and fixtures for unit tests in tests/.
Provides an in-memory SQLite database session isolated per test function.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from services.db import Base, User, Ticket, TicketHistory, TicketNote


@pytest.fixture(scope="function")
def in_memory_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    # Seed test users
    admin = User(
        id=1,
        name="IT Support Desk",
        email="admin@voiceops.edu",
        role="admin",
        password_hash="mock_hash_admin",
    )
    reporter = User(
        id=2,
        name="Lab Technician",
        email="reporter@voiceops.edu",
        role="reporter",
        password_hash="mock_hash_reporter",
    )
    db.add_all([admin, reporter])
    db.commit()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
