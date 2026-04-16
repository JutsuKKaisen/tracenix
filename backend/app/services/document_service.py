from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document
from app.models.document_category import DocumentCategory
from app.models.document_version import DocumentVersion
from app.models.enums import DocumentStatus, NotificationType, UserRole
from app.models.project import Project
from app.models.user import User
from app.models.workflow_action import WorkflowAction
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.audit_service import create_audit_log
from app.services.notification_service import notify_roles, notify_users
from app.utils.file_storage import save_uploaded_file

WORKFLOW_TRANSITIONS: dict[DocumentStatus, set[DocumentStatus]] = {
    DocumentStatus.DRAFT: {DocumentStatus.SUBMITTED},
    DocumentStatus.SUBMITTED: {DocumentStatus.UNDER_REVIEW},
    DocumentStatus.UNDER_REVIEW: {
        DocumentStatus.APPROVED,
        DocumentStatus.REJECTED,
        DocumentStatus.REVISION_REQUIRED,
    },
    DocumentStatus.REVISION_REQUIRED: {DocumentStatus.SUBMITTED},
    DocumentStatus.APPROVED: {DocumentStatus.ARCHIVED},
}


def list_documents(
    db: Session,
    project_id: str | None = None,
    current_status: DocumentStatus | None = None,
) -> list[Document]:
    stmt = select(Document).options(joinedload(Document.current_version)).order_by(Document.updated_at.desc())
    if project_id:
        stmt = stmt.where(Document.project_id == project_id)
    if current_status:
        stmt = stmt.where(Document.current_status == current_status)
    return db.scalars(stmt).unique().all()


def get_document(db: Session, document_id: str) -> Document:
    document = db.scalar(
        select(Document)
        .options(joinedload(Document.current_version))
        .where(Document.id == document_id)
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


def _ensure_references_exist(db: Session, payload: DocumentCreate | DocumentUpdate, project_id: str | None = None) -> None:
    if project_id:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if payload.category_id:
        category = db.get(DocumentCategory, payload.category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document category not found.")

    if payload.assignee_user_id:
        assignee = db.get(User, payload.assignee_user_id)
        if not assignee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee user not found.")


def create_document(db: Session, payload: DocumentCreate, actor_user_id: str) -> Document:
    _ensure_references_exist(db, payload, project_id=payload.project_id)

    document = Document(
        project_id=payload.project_id,
        category_id=payload.category_id,
        title=payload.title,
        document_code=payload.document_code,
        description=payload.description,
        assignee_user_id=payload.assignee_user_id,
        created_by=actor_user_id,
        current_status=DocumentStatus.DRAFT,
    )
    db.add(document)
    db.flush()

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="document",
        entity_id=document.id,
        action="document_create",
        metadata_json={"document_code": document.document_code, "title": document.title},
    )
    db.commit()
    db.refresh(document)
    return document


def update_document(db: Session, document_id: str, payload: DocumentUpdate, actor_user_id: str) -> Document:
    document = get_document(db, document_id)
    updates = payload.model_dump(exclude_unset=True)

    if "category_id" in updates or "assignee_user_id" in updates:
        _ensure_references_exist(
            db,
            DocumentUpdate(
                category_id=updates.get("category_id"),
                assignee_user_id=updates.get("assignee_user_id"),
            ),
        )

    for field, value in updates.items():
        setattr(document, field, value)

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="document",
        entity_id=document.id,
        action="document_update",
        metadata_json={"updated_fields": list(updates.keys())},
    )
    db.commit()
    db.refresh(document)
    return document


async def upload_document_version(
    db: Session,
    document_id: str,
    upload_file: UploadFile,
    actor_user_id: str,
    change_note: str | None = None,
) -> DocumentVersion:
    document = get_document(db, document_id)

    max_version = db.scalar(
        select(func.max(DocumentVersion.version_number)).where(DocumentVersion.document_id == document_id)
    )
    next_version = 1 if max_version is None else max_version + 1

    file_metadata = await save_uploaded_file(
        upload_file=upload_file,
        project_id=document.project_id,
        document_id=document.id,
    )

    db.execute(
        update(DocumentVersion)
        .where(DocumentVersion.document_id == document.id)
        .values(is_current=False)
    )

    version = DocumentVersion(
        document_id=document.id,
        version_number=next_version,
        file_path=file_metadata["file_path"],
        file_name=file_metadata["file_name"],
        mime_type=file_metadata["mime_type"],
        file_size=file_metadata["file_size"],
        uploaded_by=actor_user_id,
        change_note=change_note,
        is_current=True,
    )
    db.add(version)
    db.flush()

    document.current_version_id = version.id

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="document_version",
        entity_id=version.id,
        action="document_version_upload",
        metadata_json={
            "document_id": document.id,
            "version_number": version.version_number,
            "file_name": version.file_name,
        },
    )
    db.commit()
    db.refresh(version)
    return version


def list_document_versions(db: Session, document_id: str) -> list[DocumentVersion]:
    get_document(db, document_id)
    stmt = (
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
    )
    return db.scalars(stmt).all()


def get_document_version(db: Session, document_id: str, version_id: str) -> DocumentVersion:
    get_document(db, document_id)
    version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document_id,
        )
    )
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document version not found.")
    return version


def list_workflow_actions(db: Session, document_id: str) -> list[WorkflowAction]:
    get_document(db, document_id)
    stmt = (
        select(WorkflowAction)
        .where(WorkflowAction.document_id == document_id)
        .order_by(WorkflowAction.created_at.desc())
    )
    return db.scalars(stmt).all()


def transition_document_status(
    db: Session,
    document_id: str,
    to_status: DocumentStatus,
    action_type: str,
    actor_user: User,
    comment: str | None = None,
) -> Document:
    document = get_document(db, document_id)
    from_status = document.current_status

    allowed = WORKFLOW_TRANSITIONS.get(from_status, set())
    if to_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{from_status.value}' to '{to_status.value}'.",
        )

    if to_status == DocumentStatus.SUBMITTED and not document.current_version_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document must have at least one uploaded version before submission.",
        )

    document.current_status = to_status

    workflow_action = WorkflowAction(
        document_id=document.id,
        from_status=from_status,
        to_status=to_status,
        action_type=action_type,
        actor_user_id=actor_user.id,
        comment=comment,
    )
    db.add(workflow_action)
    db.flush()

    create_audit_log(
        db=db,
        actor_user_id=actor_user.id,
        entity_type="document",
        entity_id=document.id,
        action=f"document_{action_type}",
        metadata_json={
            "from_status": from_status.value,
            "to_status": to_status.value,
            "comment": comment,
        },
    )

    if to_status == DocumentStatus.SUBMITTED:
        notify_roles(
            db=db,
            roles=[UserRole.APPROVER, UserRole.PROJECT_MANAGER],
            title="Document Submitted",
            message=f"Document '{document.title}' is submitted and awaiting review.",
            notification_type=NotificationType.INFO,
            exclude_user_id=actor_user.id,
        )
    elif to_status == DocumentStatus.UNDER_REVIEW:
        notify_users(
            db=db,
            user_ids=[document.created_by, document.assignee_user_id],
            title="Document Under Review",
            message=f"Document '{document.title}' is now under review.",
            notification_type=NotificationType.INFO,
            exclude_user_id=actor_user.id,
        )
    elif to_status == DocumentStatus.APPROVED:
        notify_users(
            db=db,
            user_ids=[document.created_by, document.assignee_user_id],
            title="Document Approved",
            message=f"Document '{document.title}' has been approved.",
            notification_type=NotificationType.SUCCESS,
            exclude_user_id=actor_user.id,
        )
    elif to_status == DocumentStatus.REJECTED:
        notify_users(
            db=db,
            user_ids=[document.created_by, document.assignee_user_id],
            title="Document Rejected",
            message=f"Document '{document.title}' has been rejected.",
            notification_type=NotificationType.ERROR,
            exclude_user_id=actor_user.id,
        )
    elif to_status == DocumentStatus.REVISION_REQUIRED:
        notify_users(
            db=db,
            user_ids=[document.created_by, document.assignee_user_id],
            title="Revision Requested",
            message=f"Document '{document.title}' requires revision.",
            notification_type=NotificationType.WARNING,
            exclude_user_id=actor_user.id,
        )

    db.commit()
    db.refresh(document)
    return document
