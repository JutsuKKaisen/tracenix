from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.config import get_settings
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.enums import DocumentStatus, UserRole
from app.models.user import User
from app.schemas.document import (
    DocumentActionRequest,
    DocumentCreate,
    DocumentRead,
    DocumentUpdate,
    DocumentVersionRead,
    WorkflowActionRead,
)
from app.services.document_service import (
    create_document,
    get_document,
    get_document_version,
    list_document_versions,
    list_documents,
    list_workflow_actions,
    transition_document_status,
    update_document,
    upload_document_version,
)

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.get("", response_model=list[DocumentRead])
def get_documents(
    project_id: str | None = None,
    current_status: DocumentStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[DocumentRead]:
    documents = list_documents(db=db, project_id=project_id, current_status=current_status)
    return [DocumentRead.model_validate(document) for document in documents]


@router.post("", response_model=DocumentRead)
def create_new_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
            UserRole.SITE_ENGINEER,
        )
    ),
) -> DocumentRead:
    document = create_document(db=db, payload=payload, actor_user_id=current_user.id)
    return DocumentRead.model_validate(document)


@router.get("/{document_id}", response_model=DocumentRead)
def get_document_by_id(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DocumentRead:
    document = get_document(db=db, document_id=document_id)
    return DocumentRead.model_validate(document)


@router.patch("/{document_id}", response_model=DocumentRead)
def patch_document(
    document_id: str,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
            UserRole.SITE_ENGINEER,
        )
    ),
) -> DocumentRead:
    document = update_document(db=db, document_id=document_id, payload=payload, actor_user_id=current_user.id)
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/versions", response_model=DocumentVersionRead)
async def create_document_version(
    document_id: str,
    file: UploadFile = File(...),
    change_note: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
            UserRole.SITE_ENGINEER,
        )
    ),
) -> DocumentVersionRead:
    version = await upload_document_version(
        db=db,
        document_id=document_id,
        upload_file=file,
        actor_user_id=current_user.id,
        change_note=change_note,
    )
    return DocumentVersionRead.model_validate(version)


@router.get("/{document_id}/versions", response_model=list[DocumentVersionRead])
def get_versions(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[DocumentVersionRead]:
    versions = list_document_versions(db=db, document_id=document_id)
    return [DocumentVersionRead.model_validate(version) for version in versions]


@router.get("/{document_id}/workflow-actions", response_model=list[WorkflowActionRead])
def get_document_workflow_actions(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[WorkflowActionRead]:
    actions = list_workflow_actions(db=db, document_id=document_id)
    return [WorkflowActionRead.model_validate(action) for action in actions]


@router.post("/{document_id}/submit", response_model=DocumentRead)
def submit_document(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
            UserRole.SITE_ENGINEER,
        )
    ),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.SUBMITTED,
        action_type="submit",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/start-review", response_model=DocumentRead)
def start_review(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.APPROVER,
        )
    ),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.UNDER_REVIEW,
        action_type="review",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/review", response_model=DocumentRead)
def review_document(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.APPROVER,
        )
    ),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.UNDER_REVIEW,
        action_type="review",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/approve", response_model=DocumentRead)
def approve_document(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER, UserRole.APPROVER)),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.APPROVED,
        action_type="approve",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/reject", response_model=DocumentRead)
def reject_document(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER, UserRole.APPROVER)),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.REJECTED,
        action_type="reject",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/archive", response_model=DocumentRead)
def archive_document(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER, UserRole.APPROVER)),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.ARCHIVED,
        action_type="archive",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.post("/{document_id}/request-revision", response_model=DocumentRead)
def request_revision_document(
    document_id: str,
    payload: DocumentActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER, UserRole.APPROVER)),
) -> DocumentRead:
    document = transition_document_status(
        db=db,
        document_id=document_id,
        to_status=DocumentStatus.REVISION_REQUIRED,
        action_type="request_revision",
        actor_user=current_user,
        comment=payload.comment,
    )
    return DocumentRead.model_validate(document)


@router.get("/{document_id}/versions/{version_id}/download")
def download_document_version(
    document_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FileResponse:
    version = get_document_version(db=db, document_id=document_id, version_id=version_id)
    upload_root = Path(settings.upload_root).resolve()
    file_path = (upload_root / version.file_path).resolve()

    try:
        file_path.relative_to(upload_root)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.") from exc

    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    return FileResponse(path=file_path, media_type=version.mime_type, filename=version.file_name)
