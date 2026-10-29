from fastapi import APIRouter, HTTPException, status
from app.schemas.ticket import IssueExtractionRequest, IssueExtractionResponse
from app.services.extraction import extraction_service

router = APIRouter(prefix="/api/issues", tags=["Issue Extraction"])


@router.post("/extract", response_model=IssueExtractionResponse)
def extract_issue_fields(payload: IssueExtractionRequest):
    """
    Extract structured issue information (title, description, category, location, priority)
    from reviewed transcript text. Identifies missing or uncertain fields before user confirmation.
    """
    if not payload.transcript_reviewed.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty."
        )

    return extraction_service.extract_structured_issue(
        transcript=payload.transcript_reviewed,
        language=payload.language or "te-IN"
    )
