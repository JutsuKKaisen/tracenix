from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = Field(default="Tracenix Backend", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    secret_key: str = Field(default="change-this-secret", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=480, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_algorithm: str = "HS256"

    database_url: str = Field(default="sqlite:///./tracenix.db", alias="DATABASE_URL")

    upload_root: str = Field(default="./data/uploads", alias="UPLOAD_ROOT")
    max_upload_size_mb: int = Field(default=25, alias="MAX_UPLOAD_SIZE_MB")
    allowed_mime_types: str = Field(
        default=(
            "application/pdf,"
            "application/msword,"
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
            "image/png,image/jpeg"
        ),
        alias="ALLOWED_MIME_TYPES",
    )

    cors_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000", alias="CORS_ORIGINS")

    seed_admin_email: str = Field(default="admin@tracenix.com", alias="SEED_ADMIN_EMAIL")
    seed_admin_password: str = Field(default="admin12345", alias="SEED_ADMIN_PASSWORD")
    seed_admin_full_name: str = Field(default="System Administrator", alias="SEED_ADMIN_FULL_NAME")

    @property
    def upload_max_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def parsed_allowed_mime_types(self) -> set[str]:
        return {item.strip() for item in self.allowed_mime_types.split(",") if item.strip()}

    @property
    def parsed_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
