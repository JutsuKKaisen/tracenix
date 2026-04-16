from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.document_category import DocumentCategoryCreate, DocumentCategoryRead
from app.services.category_service import create_category, list_categories

router = APIRouter(prefix="/document-categories", tags=["document-categories"])


@router.get("", response_model=list[DocumentCategoryRead])
def get_document_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[DocumentCategoryRead]:
    categories = list_categories(db)
    return [DocumentCategoryRead.model_validate(category) for category in categories]


@router.post("", response_model=DocumentCategoryRead)
def create_document_category(
    payload: DocumentCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SYSTEM_ADMIN,
            UserRole.PROJECT_MANAGER,
            UserRole.DOCUMENT_CONTROLLER,
        )
    ),
) -> DocumentCategoryRead:
    category = create_category(db=db, payload=payload, actor_user_id=current_user.id)
    return DocumentCategoryRead.model_validate(category)

