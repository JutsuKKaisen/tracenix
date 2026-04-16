from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import DocumentStatus


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("document_categories.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_code: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, native_enum=False), nullable=False, default=DocumentStatus.DRAFT
    )
    current_version_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("document_versions.id"), nullable=True
    )
    assignee_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project: Mapped["Project"] = relationship("Project", back_populates="documents")
    category: Mapped["DocumentCategory"] = relationship("DocumentCategory", back_populates="documents")
    creator: Mapped["User"] = relationship("User", back_populates="created_documents", foreign_keys=[created_by])
    assignee: Mapped["User | None"] = relationship(
        "User",
        back_populates="assigned_documents",
        foreign_keys=[assignee_user_id],
    )
    versions: Mapped[list["DocumentVersion"]] = relationship(
        "DocumentVersion",
        back_populates="document",
        foreign_keys="DocumentVersion.document_id",
        cascade="all, delete-orphan",
    )
    current_version: Mapped["DocumentVersion | None"] = relationship(
        "DocumentVersion",
        foreign_keys=[current_version_id],
        post_update=True,
    )
    workflow_actions: Mapped[list["WorkflowAction"]] = relationship(
        "WorkflowAction",
        back_populates="document",
        cascade="all, delete-orphan",
    )

