from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import SERVICE_ROOT, get_settings

AVATAR_DIR = SERVICE_ROOT / "static" / "avatar"


def ensure_avatar_dir() -> Path:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    return AVATAR_DIR


def validate_avatar(file: UploadFile) -> None:
    settings = get_settings()
    if not file.filename:
        raise HTTPException(status_code=400, detail="请选择文件")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in settings.avatar_allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"仅支持：{', '.join(settings.avatar_allowed_extensions)}",
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    max_bytes = settings.avatar_max_size_mb * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"头像不能超过 {settings.avatar_max_size_mb}MB",
        )
