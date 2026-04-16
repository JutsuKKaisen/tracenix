from datetime import date, datetime

from app.models.enums import ProjectStatus
from app.schemas.common import ORMModel


class ProjectBase(ORMModel):
    code: str
    name: str
    description: str | None = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    start_date: date | None = None
    end_date: date | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ORMModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectRead(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

