"""POST /api/admin/period/{open,close,reset}."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth.deps import require_admin
from ..auth.session import SessionUser
from ..db import connection, transaction
from ..models import period as period_mod

router = APIRouter(prefix="/api/admin/period", tags=["admin", "period"])


@router.post("/open", status_code=204)
async def open_period(admin: SessionUser = Depends(require_admin)) -> None:
    with connection() as conn, transaction(conn):
        period_mod.transition(
            conn, expected_from="preparacion", to_state="abierto", admin_email=admin.email
        )


@router.post("/close", status_code=204)
async def close_period(admin: SessionUser = Depends(require_admin)) -> None:
    with connection() as conn, transaction(conn):
        period_mod.transition(
            conn, expected_from="abierto", to_state="cerrado", admin_email=admin.email
        )


@router.post("/reset", status_code=204)
async def reset_period(admin: SessionUser = Depends(require_admin)) -> None:
    with connection() as conn, transaction(conn):
        period_mod.transition(
            conn, expected_from="cerrado", to_state="preparacion", admin_email=admin.email
        )
