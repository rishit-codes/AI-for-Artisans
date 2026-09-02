import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.core.exceptions import ArtisanNotFoundError, ArtisanForbiddenError
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.crud.task import create_task, list_tasks, get_task, update_task, delete_task

router = APIRouter()


@router.get("", response_model=list[TaskRead])
async def get_tasks(
    status: Optional[str] = Query(None, description="Filter by pending/done/snoozed"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    return await list_tasks(db, current_user.id, status)


@router.post("", response_model=TaskRead, status_code=201)
async def add_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    return await create_task(db, current_user.id, data)


@router.patch("/{task_id}", response_model=TaskRead)
async def patch_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    task = await get_task(db, task_id)
    if not task:
        raise ArtisanNotFoundError(detail="Task not found")
    if task.user_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized to update this task")
    return await update_task(db, task, data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    task = await get_task(db, task_id)
    if not task:
        raise ArtisanNotFoundError(detail="Task not found")
    if task.user_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized to delete this task")
    await delete_task(db, task)
