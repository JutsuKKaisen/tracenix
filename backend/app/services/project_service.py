from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.audit_service import create_audit_log


def list_projects(db: Session) -> list[Project]:
    return db.scalars(select(Project).order_by(Project.created_at.desc())).all()


def get_project(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


def create_project(db: Session, payload: ProjectCreate, actor_user_id: str) -> Project:
    existing = db.scalar(select(Project).where(Project.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project code already exists.")

    project = Project(**payload.model_dump())
    db.add(project)
    db.flush()

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="project",
        entity_id=project.id,
        action="project_create",
        metadata_json={"code": project.code, "name": project.name},
    )
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: str, payload: ProjectUpdate, actor_user_id: str) -> Project:
    project = get_project(db, project_id)
    updates = payload.model_dump(exclude_unset=True)

    if "code" in updates and updates["code"] != project.code:
        existing = db.scalar(select(Project).where(Project.code == updates["code"]))
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project code already exists.")

    for field, value in updates.items():
        setattr(project, field, value)

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="project",
        entity_id=project.id,
        action="project_update",
        metadata_json={"updated_fields": list(updates.keys())},
    )
    db.commit()
    db.refresh(project)
    return project

