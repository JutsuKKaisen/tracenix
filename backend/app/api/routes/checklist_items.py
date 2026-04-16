from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.enums import ChecklistStatus, UserRole
from app.models.user import User
from app.schemas.checklist_item import ChecklistItemCreate, ChecklistItemRead, ChecklistItemUpdate
from app.services.checklist_service import create_checklist_item, list_checklist_items, update_checklist_item

router = APIRouter(prefix="/checklist-items", tags=["checklist-items"])


@router.get("", response_model=list[ChecklistItemRead])
def get_checklist_items(
    project_id: str | None = None,
    status: ChecklistStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ChecklistItemRead]:
    items = list_checklist_items(db=db, project_id=project_id, status_filter=status)
    return [ChecklistItemRead.model_validate(item) for item in items]


@router.post("", response_model=ChecklistItemRead)
def create_new_checklist_item(
    payload: ChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
            UserRole.SITE_ENGINEER,
        )
    ),
) -> ChecklistItemRead:
    item = create_checklist_item(db=db, payload=payload, actor_user_id=current_user.id)
    return ChecklistItemRead.model_validate(item)


@router.patch("/{checklist_id}", response_model=ChecklistItemRead)
def patch_checklist_item(
    checklist_id: str,
    payload: ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
            UserRole.SITE_ENGINEER,
        )
    ),
) -> ChecklistItemRead:
    item = update_checklist_item(
        db=db,
        checklist_id=checklist_id,
        payload=payload,
        actor_user_id=current_user.id,
    )
    return ChecklistItemRead.model_validate(item)

