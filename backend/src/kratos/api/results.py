"""GET /api/results y /api/results.csv — ranking final.

Política de acceso:
- `GET /api/results` (JSON): **público** cuando el periodo está `cerrado`.
  No requiere sesión. Esto permite que el ranking sea consultable desde
  cualquier dispositivo, dentro o fuera del Workspace de Phicus, una vez
  publicado oficialmente al cerrar el periodo.
- `GET /api/results.csv`: sigue siendo **admin-only**, ya que exportar
  el dataset entero es una acción administrativa que queda registrada
  en el audit log (Principio V).

En ambos casos, el endpoint sólo entrega datos con `state == "cerrado"`;
en cualquier otro estado responde 409.
"""

from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Response

from ..auth.deps import require_admin
from ..auth.session import SessionUser
from ..db import connection
from ..models import audit, period
from ..models import results as results_model
from ..models.schemas import Ranking, RankingEntry

router = APIRouter(prefix="/api", tags=["results"])


@router.get("/results", response_model=Ranking)
async def get_results() -> Ranking:
    # Endpoint público (sin require_user): el ranking final es información
    # pública del Workspace una vez cerrado el periodo.
    with connection() as conn:
        p = period.get_period(conn)
        if p["state"] != "cerrado":
            raise HTTPException(
                status_code=409,
                detail="Los resultados están disponibles cuando el periodo esté cerrado.",
            )
        entries = [RankingEntry(**r) for r in results_model.ranking(conn)]
        return Ranking(period_state=p["state"], closed_at=p["closed_at"], entries=entries)


@router.get("/results.csv")
async def get_results_csv(admin: SessionUser = Depends(require_admin)):
    with connection() as conn:
        p = period.get_period(conn)
        if p["state"] != "cerrado":
            raise HTTPException(
                status_code=409,
                detail="Los resultados están disponibles cuando el periodo esté cerrado.",
            )
        rows = results_model.ranking(conn)
        audit.append(conn, admin_email=admin.email, action="RESULTS_EXPORT")

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["proposal_id", "name", "total_score", "vote_count"])
    for r in rows:
        writer.writerow([r["proposal_id"], r["name"], r["total_score"], r["vote_count"]])
    return Response(
        content=out.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="resultados.csv"'},
    )
