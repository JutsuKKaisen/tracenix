from app.schemas.common import ORMModel


class DocumentCategoryBase(ORMModel):
    name: str
    code: str
    description: str | None = None
    is_active: bool = True


class DocumentCategoryCreate(DocumentCategoryBase):
    pass


class DocumentCategoryRead(DocumentCategoryBase):
    id: str

