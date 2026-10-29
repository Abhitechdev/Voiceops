from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
def get_operational_analytics_summary(
    sla_hours: int = Query(48, ge=1, le=720, description="SLA threshold in hours to flag overdue tickets"),
    db: Session = Depends(get_db)
):
    """
    Retrieve operational metrics calculated purely from database records.
    Produces accurate zero-state values when database has no tickets.
    """
    return analytics_service.get_dashboard_summary(db=db, sla_hours=sla_hours)
