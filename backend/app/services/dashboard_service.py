from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.checklist_item import ChecklistItem
from app.models.document import Document
from app.models.enums import ChecklistStatus, DocumentStatus
from app.schemas.dashboard import DashboardSummary


def get_dashboard_summary(db: Session) -> DashboardSummary:
    total_documents = db.scalar(select(func.count(Document.id))) or 0
    total_checklist_items = db.scalar(select(func.count(ChecklistItem.id))) or 0

    grouped_status_rows = db.execute(
        select(Document.current_status, func.count(Document.id)).group_by(Document.current_status)
    ).all()

    documents_by_status = {status.value: 0 for status in DocumentStatus}
    for status_value, count in grouped_status_rows:
        documents_by_status[status_value.value] = count

    overdue_checklist_count = db.scalar(
        select(func.count(ChecklistItem.id)).where(ChecklistItem.status == ChecklistStatus.OVERDUE)
    ) or 0
    approved_documents_count = db.scalar(
        select(func.count(Document.id)).where(Document.current_status == DocumentStatus.APPROVED)
    ) or 0
    revision_required_count = db.scalar(
        select(func.count(Document.id)).where(Document.current_status == DocumentStatus.REVISION_REQUIRED)
    ) or 0
    pending_review_count = db.scalar(
        select(func.count(Document.id)).where(
            Document.current_status.in_([DocumentStatus.SUBMITTED, DocumentStatus.UNDER_REVIEW])
        )
    ) or 0

    return DashboardSummary(
        total_documents=total_documents,
        documents_by_status=documents_by_status,
        total_checklist_items=total_checklist_items,
        overdue_checklist_count=overdue_checklist_count,
        approved_documents_count=approved_documents_count,
        revision_required_count=revision_required_count,
        pending_review_count=pending_review_count,
    )

