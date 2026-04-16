from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import api_router
from app.core.config import get_settings
from app.db.init_db import create_schema, ensure_upload_root, seed_defaults
from app.db.session import SessionLocal

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_schema()
    ensure_upload_root()
    db = SessionLocal()
    try:
        seed_defaults(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory=settings.upload_root), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
