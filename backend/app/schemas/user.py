from datetime import datetime

from pydantic import EmailStr

from app.models.enums import UserRole
from app.schemas.common import ORMModel


class UserBase(ORMModel):
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(ORMModel):
    full_name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserRead(UserBase):
    id: str
    created_at: datetime

