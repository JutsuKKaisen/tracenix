from datetime import date, datetime

from app.models.enums import ChecklistStatus
from app.schemas.common import ORMModel


class ChecklistItemBase(ORMModel):
    project_id: str
    category_id: str
    title: str
    description: str | None = None
    required: bool = True
    due_date: date | None = None
    status: ChecklistStatus = ChecklistStatus.PENDING
    related_document_id: str | None = None
    owner_user_id: str | None = None


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemUpdate(ORMModel):
    category_id: str | None = None
    title: str | None = None
    description: str | None = None
    required: bool | None = None
    due_date: date | None = None
    status: ChecklistStatus | None = None
    related_document_id: str | None = None
    owner_user_id: str | None = None


class ChecklistItemRead(ChecklistItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

