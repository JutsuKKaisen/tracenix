from datetime import datetime

from pydantic import BaseModel

from app.models.enums import DocumentStatus
from app.schemas.common import ORMModel


class DocumentVersionRead(ORMModel):
    id: str
    document_id: str
    version_number: int
    file_path: str
    file_name: str
    mime_type: str
    file_size: int
    uploaded_by: str
    uploaded_at: datetime
    change_note: str | None = None
    is_current: bool


class WorkflowActionRead(ORMModel):
    id: str
    document_id: str
    from_status: DocumentStatus
    to_status: DocumentStatus
    action_type: str
    actor_user_id: str
    comment: str | None = None
    created_at: datetime


class DocumentBase(ORMModel):
    project_id: str
    category_id: str
    title: str
    document_code: str
    description: str | None = None
    assignee_user_id: str | None = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(ORMModel):
    category_id: str | None = None
    title: str | None = None
    document_code: str | None = None
    description: str | None = None
    assignee_user_id: str | None = None


class DocumentRead(DocumentBase):
    id: str
    current_status: DocumentStatus
    current_version_id: str | None = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    current_version: DocumentVersionRead | None = None


class DocumentActionRequest(BaseModel):
    comment: str | None = None

