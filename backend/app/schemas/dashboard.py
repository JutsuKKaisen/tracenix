from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_documents: int
    documents_by_status: dict[str, int]
    total_checklist_items: int
    overdue_checklist_count: int
    approved_documents_count: int
    revision_required_count: int
    pending_review_count: int

