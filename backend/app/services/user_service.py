from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import create_audit_log


def list_users(db: Session) -> list[User]:
    return db.scalars(select(User).order_by(User.created_at.desc())).all()


def get_user_by_id(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def create_user(db: Session, payload: UserCreate, actor_user_id: str) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="user",
        entity_id=user.id,
        action="user_create",
        metadata_json={"email": user.email, "role": user.role.value},
    )
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: str, payload: UserUpdate, actor_user_id: str) -> User:
    user = get_user_by_id(db, user_id)
    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"] != user.email:
        existing = db.scalar(select(User).where(User.email == data["email"]))
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")

    if "password" in data:
        user.hashed_password = get_password_hash(data.pop("password"))

    for field, value in data.items():
        setattr(user, field, value)

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="user",
        entity_id=user.id,
        action="user_update",
        metadata_json={"updated_fields": list(data.keys())},
    )
    db.commit()
    db.refresh(user)
    return user

