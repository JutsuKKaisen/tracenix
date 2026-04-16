from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_active_user
from app.models.enums import UserRole
from app.models.user import User


def require_roles(*roles: UserRole):
    allowed_roles = set(roles)

    def role_dependency(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return role_dependency

