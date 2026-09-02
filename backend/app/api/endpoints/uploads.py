import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.storage import get_storage_backend

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

async def _validate_image(file: UploadFile) -> tuple[bytes, str]:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are allowed.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB.")

    try:
        Image.open(io.BytesIO(contents)).verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    return contents, ALLOWED_CONTENT_TYPES[file.content_type]

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload/replace the current artisan's profile photo."""
    contents, ext = await _validate_image(file)
    filename = f"{current_user.id}.{ext}"
    avatar_url = get_storage_backend().save("avatars", filename, contents)
    current_user.avatar_url = avatar_url
    db.add(current_user)
    await db.commit()

    return {"avatar_url": avatar_url}

@router.post("/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a product photo and get back its URL. Doesn't touch the DB —
    the caller attaches the returned URL when creating/updating a product.
    """
    contents, ext = await _validate_image(file)
    filename = f"{uuid.uuid4()}.{ext}"
    image_url = get_storage_backend().save("products", filename, contents)

    return {"image_url": image_url}
