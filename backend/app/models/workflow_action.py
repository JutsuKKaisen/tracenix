from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import DocumentStatus


class WorkflowAction(Base):
    __tablename__ = "workflow_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    from_status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus, native_enum=False), nullable=False)
    to_status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus, native_enum=False), nullable=False)
    action_type: Mapped[str] = mapped_column(String(80), nullable=False)
    actor_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    document: Mapped["Document"] = relationship("Document", back_populates="workflow_actions")

