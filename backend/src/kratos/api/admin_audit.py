"""GET /api/admin/audit-log — log administrativo append-only."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..auth.deps import require_admin
from ..auth.session import SessionUser
from ..db import connection
from ..models import audit
from ..models.schemas import AuditEntry

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/audit-log", response_model=list[AuditEntry])
async def list_audit(
    limit: int = Query(default=200, ge=1, le=1000),
    admin: SessionUser = Depends(require_admin),
) -> list[AuditEntry]:
    del admin
    with connection() as conn:
        entries = audit.list_entries(conn, limit=limit)
    return [AuditEntry(**e) for e in entries]
