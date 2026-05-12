"""GET /api/admin/dashboard — datos agregados del panel admin.

Combina estado del periodo, contadores de propuestas, papeletas emitidas
y las últimas 5 acciones del audit log. **No consulta `vote_scores`.**
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth.deps import require_admin
from ..auth.session import SessionUser
from ..db import connection
from ..models import audit, period
from ..models.schemas import (
    AuditEntry,
    DashboardCounters,
    DashboardData,
    DashboardPeriod,
)

router = APIRouter(prefix="/api/admin", tags=["admin", "dashboard"])


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(admin: SessionUser = Depends(require_admin)) -> DashboardData:
    del admin
    with connection() as conn:
        p = period.get_period(conn)
        counters_row = conn.execute(
            "SELECT "
            "SUM(CASE WHEN status='votable'       THEN 1 ELSE 0 END) AS votable, "
            "SUM(CASE WHEN status='excluded'      THEN 1 ELSE 0 END) AS excluded, "
            "SUM(CASE WHEN status='merged_parent' THEN 1 ELSE 0 END) AS merged_parent "
            "FROM proposals"
        ).fetchone()
        ballots_cast = conn.execute(
            "SELECT COUNT(*) AS c FROM vote_receipts WHERE period_id = ?",
            (period.PERIOD_ID,),
        ).fetchone()["c"]
        recent = audit.list_entries(conn, limit=5)

    return DashboardData(
        period=DashboardPeriod(
            state=p["state"],
            opened_at=p["opened_at"],
            closed_at=p["closed_at"],
            opened_by=p.get("opened_by"),
            closed_by=p.get("closed_by"),
            expected_quorum=p.get("expected_quorum"),
        ),
        counters=DashboardCounters(
            votable=int(counters_row["votable"] or 0),
            excluded=int(counters_row["excluded"] or 0),
            merged_parent=int(counters_row["merged_parent"] or 0),
            ballots_cast=int(ballots_cast or 0),
        ),
        recent_audit=[AuditEntry(**e) for e in recent],
    )
