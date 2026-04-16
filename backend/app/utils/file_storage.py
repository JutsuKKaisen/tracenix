from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


async def save_uploaded_file(upload_file: UploadFile, project_id: str, document_id: str) -> dict[str, str | int]:
    settings = get_settings()

    content_type = upload_file.content_type or ""
    if content_type not in settings.parsed_allowed_mime_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type.")

    base_upload_root = Path(settings.upload_root)
    target_dir = base_upload_root / "projects" / project_id / "documents" / document_id
    target_dir.mkdir(parents=True, exist_ok=True)

    original_name = upload_file.filename or "uploaded_file"
    suffix = Path(original_name).suffix
    stored_filename = f"{uuid4().hex}{suffix}"
    destination = target_dir / stored_filename

    total_size = 0
    try:
        with destination.open("wb") as output:
            while True:
                chunk = await upload_file.read(1024 * 1024)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > settings.upload_max_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File is too large. Max size is {settings.max_upload_size_mb} MB.",
                    )
                output.write(chunk)
    except Exception:
        if destination.exists():
            destination.unlink(missing_ok=True)
        raise
    finally:
        await upload_file.close()

    if total_size <= 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    relative_path = destination.relative_to(base_upload_root).as_posix()
    return {
        "file_path": relative_path,
        "file_name": original_name,
        "mime_type": content_type,
        "file_size": total_size,
    }

