from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import create_user, list_users, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER)),
) -> list[UserRead]:
    users = list_users(db)
    return [UserRead.model_validate(user) for user in users]


@router.post("", response_model=UserRead)
def create_new_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN)),
) -> UserRead:
    user = create_user(db=db, payload=payload, actor_user_id=current_user.id)
    return UserRead.model_validate(user)


@router.patch("/{user_id}", response_model=UserRead)
def patch_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN)),
) -> UserRead:
    user = update_user(db=db, user_id=user_id, payload=payload, actor_user_id=current_user.id)
    return UserRead.model_validate(user)

