"""File storage backend abstraction.

Every upload endpoint (avatars, product images) goes through this instead of
touching the filesystem directly, so swapping in a real object store (S3,
GCS, Azure Blob) later is a matter of adding one class here and flipping
STORAGE_BACKEND — no caller changes. No cloud credentials exist for this
project, so LocalDiskStorage (writing under backend/uploads/, served by the
StaticFiles mount in main.py) is the only backend implemented today.
"""
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings


class StorageBackend(ABC):
    @abstractmethod
    def save(self, subdir: str, filename: str, contents: bytes) -> str:
        """Persist `contents` and return the public URL path clients should use."""

    @abstractmethod
    def delete(self, url: str) -> None:
        """Best-effort delete of a previously-saved file, given the URL save() returned."""


class LocalDiskStorage(StorageBackend):
    def __init__(self, root: Path):
        self.root = root

    def save(self, subdir: str, filename: str, contents: bytes) -> str:
        target_dir = self.root / subdir
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / filename).write_bytes(contents)
        return f"/uploads/{subdir}/{filename}"

    def delete(self, url: str) -> None:
        if not url.startswith("/uploads/"):
            return
        path = self.root / url.removeprefix("/uploads/")
        path.unlink(missing_ok=True)


_UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"

_BACKENDS = {
    "local": lambda: LocalDiskStorage(_UPLOAD_ROOT),
}


def get_storage_backend() -> StorageBackend:
    backend = settings.STORAGE_BACKEND
    if backend not in _BACKENDS:
        raise NotImplementedError(
            f"STORAGE_BACKEND='{backend}' has no implementation yet — only 'local' "
            "is wired up (no cloud storage credentials exist for this project)."
        )
    return _BACKENDS[backend]()
