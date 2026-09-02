import json
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional, List

from app.db.session import get_db
from app.api.dependencies import require_admin
from app.core.exceptions import ArtisanNotFoundError, ArtisanConflictError
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.admin_audit_log import AdminAuditLog
from app.models.email_outbox import EmailOutbox
from app.schemas.admin import (
    AdminUsersPage, AdminUserRow, AdminUserUpdate, AdminMetrics, CraftTypeCount,
    BulkUserUpdate, BulkUpdateResult, AuditLogEntry, EmailOutboxEntry,
)

router = APIRouter(dependencies=[Depends(require_admin)])


async def _log_admin_action(db: AsyncSession, admin: User, target: User, action: str, details: Optional[dict] = None) -> None:
    db.add(AdminAuditLog(
        admin_id=admin.id,
        admin_email=admin.email,
        target_user_id=target.id,
        target_email=target.email,
        action=action,
        details=json.dumps(details) if details else None,
    ))


def _parse_bio(bio: Optional[str]) -> dict:
    if not bio:
        return {}
    try:
        return json.loads(bio)
    except (json.JSONDecodeError, TypeError):
        return {}


def _user_to_row(user: User, product_count: int) -> AdminUserRow:
    bio = _parse_bio(user.bio)
    return AdminUserRow(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        craft_type=user.craft_type,
        location=user.location,
        role=user.role,
        is_active=user.is_active,
        gi_certified=bool(bio.get("giCertified", False)),
        gi_year=bio.get("giYear"),
        product_count=product_count,
        created_at=user.created_at,
    )


@router.get("/metrics", response_model=AdminMetrics)
async def get_admin_metrics(db: AsyncSession = Depends(get_db)) -> Any:
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar_one()
    admin_users = (await db.execute(select(func.count(User.id)).where(User.role == "admin"))).scalar_one()

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    signups_last_30_days = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
    )).scalar_one()

    total_products = (await db.execute(select(func.count(Product.id)))).scalar_one()
    listed_products = (await db.execute(select(func.count(Product.id)).where(Product.is_listed == True))).scalar_one()

    total_orders = (await db.execute(select(func.count(Order.id)))).scalar_one()
    total_sales_value = (await db.execute(select(func.coalesce(func.sum(Order.total_price), 0)))).scalar_one()

    craft_rows = await db.execute(
        select(User.craft_type, func.count(User.id))
        .where(User.craft_type.is_not(None))
        .group_by(User.craft_type)
        .order_by(func.count(User.id).desc())
    )
    users_by_craft_type = [CraftTypeCount(craft_type=ct, count=c) for ct, c in craft_rows.all()]

    return AdminMetrics(
        total_users=total_users,
        active_users=active_users,
        suspended_users=total_users - active_users,
        admin_users=admin_users,
        signups_last_30_days=signups_last_30_days,
        total_products=total_products,
        listed_products=listed_products,
        total_orders=total_orders,
        total_sales_value=float(total_sales_value),
        users_by_craft_type=users_by_craft_type,
    )


@router.get("/users", response_model=AdminUsersPage)
async def list_admin_users(
    search: Optional[str] = Query(None, description="Match against email or full name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(User)
    count_stmt = select(func.count(User.id))
    if search:
        like = f"%{search.strip()}%"
        clause = or_(User.email.ilike(like), User.full_name.ilike(like))
        stmt = stmt.where(clause)
        count_stmt = count_stmt.where(clause)

    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    users = (await db.execute(stmt)).scalars().all()

    # One grouped query for product counts, instead of one query per row.
    user_ids = [u.id for u in users]
    counts_by_user: dict[uuid.UUID, int] = {}
    if user_ids:
        count_rows = await db.execute(
            select(Product.artisan_id, func.count(Product.id))
            .where(Product.artisan_id.in_(user_ids))
            .group_by(Product.artisan_id)
        )
        counts_by_user = dict(count_rows.all())

    rows = [_user_to_row(u, counts_by_user.get(u.id, 0)) for u in users]
    return AdminUsersPage(users=rows, total=total, page=page, page_size=page_size)


@router.patch("/users/bulk", response_model=BulkUpdateResult)
async def bulk_update_users(
    data: BulkUserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    if data.role is not None and data.role not in ("user", "admin"):
        raise ArtisanConflictError(detail="Role must be 'user' or 'admin'")

    result = await db.execute(select(User).where(User.id.in_(data.user_ids)))
    targets = result.scalars().all()

    updated = 0
    skipped: list[str] = []
    for target in targets:
        if target.id == admin.id:
            skipped.append(target.email)
            continue
        if data.role is not None and data.role != target.role:
            await _log_admin_action(db, admin, target, "role_change", {"from": target.role, "to": data.role, "bulk": True})
            target.role = data.role
        if data.is_active is not None and data.is_active != target.is_active:
            await _log_admin_action(db, admin, target, "suspend" if not data.is_active else "reactivate", {"bulk": True})
            target.is_active = data.is_active
            if data.is_active is False:
                target.token_version += 1
        db.add(target)
        updated += 1

    await db.commit()
    return BulkUpdateResult(updated=updated, skipped=skipped)


@router.patch("/users/{user_id}", response_model=AdminUserRow)
async def update_admin_user(
    user_id: uuid.UUID,
    data: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise ArtisanNotFoundError(detail="User not found")

    is_self = target.id == admin.id
    if is_self and data.role is not None and data.role != "admin":
        raise ArtisanConflictError(detail="Cannot revoke your own admin access")
    if is_self and data.is_active is False:
        raise ArtisanConflictError(detail="Cannot suspend your own account")

    if data.role is not None:
        if data.role not in ("user", "admin"):
            raise ArtisanConflictError(detail="Role must be 'user' or 'admin'")
        if data.role != target.role:
            await _log_admin_action(db, admin, target, "role_change", {"from": target.role, "to": data.role})
        target.role = data.role
    if data.is_active is not None:
        if data.is_active != target.is_active:
            await _log_admin_action(db, admin, target, "suspend" if not data.is_active else "reactivate")
        target.is_active = data.is_active
        if data.is_active is False:
            # Suspension should also kill any live sessions immediately.
            target.token_version += 1

    if data.gi_certified is not None or data.gi_year is not None:
        bio = _parse_bio(target.bio)
        if data.gi_certified is not None:
            if data.gi_certified != bio.get("giCertified", False):
                await _log_admin_action(db, admin, target, "gi_certification", {"gi_certified": data.gi_certified, "gi_year": data.gi_year})
            bio["giCertified"] = data.gi_certified
        if data.gi_year is not None:
            bio["giYear"] = data.gi_year
        target.bio = json.dumps(bio)

    db.add(target)
    await db.commit()
    await db.refresh(target)

    product_count = (await db.execute(
        select(func.count(Product.id)).where(Product.artisan_id == target.id)
    )).scalar_one()
    return _user_to_row(target, product_count)


@router.get("/audit-log", response_model=List[AuditLogEntry])
async def get_audit_log(
    target_user_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(limit)
    if target_user_id:
        stmt = stmt.where(AdminAuditLog.target_user_id == target_user_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/email-outbox", response_model=List[EmailOutboxEntry])
async def get_email_outbox(
    to_email: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Dev/sandbox inspection of emails the app 'sent' — see app.services.email
    for why there's no real SMTP transport wired up yet."""
    stmt = select(EmailOutbox).order_by(EmailOutbox.created_at.desc()).limit(limit)
    if to_email:
        stmt = stmt.where(EmailOutbox.to_email == to_email)
    result = await db.execute(stmt)
    return result.scalars().all()
