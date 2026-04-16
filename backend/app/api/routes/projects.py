from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import create_project, get_project, list_projects, update_project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ProjectRead]:
    projects = list_projects(db)
    return [ProjectRead.model_validate(project) for project in projects]


@router.post("", response_model=ProjectRead)
def create_new_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER)),
) -> ProjectRead:
    project = create_project(db=db, payload=payload, actor_user_id=current_user.id)
    return ProjectRead.model_validate(project)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project_by_id(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ProjectRead:
    project = get_project(db, project_id)
    return ProjectRead.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectRead)
def patch_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER)),
) -> ProjectRead:
    project = update_project(db=db, project_id=project_id, payload=payload, actor_user_id=current_user.id)
    return ProjectRead.model_validate(project)

