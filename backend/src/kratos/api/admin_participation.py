"""Endpoints de participación: lista de votantes (sin scores) + aforo.

**Principio I (Anonimato) — INNEGOCIABLE**: este módulo NO importa
`vote_scores`, `results`, ni `ballot`. La única lectura sobre tablas
de votación es `SELECT user_email, voted_at FROM vote_receipts` —
explicitamente sin JOIN con `vote_scores`.

El test `test_participation_no_score_leak.py` verifica esta invariante
de forma estructural (AST), de queries (trace) y de payload (regex
sobre el JSON).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..auth.deps import require_admin
from ..auth.session import SessionUser
from ..db import connection, transaction
from ..models import period
from ..models.schemas import (
    ParticipationData,
    QuorumUpdateRequest,
    VoterReceiptSummary,
)

router = APIRouter(prefix="/api/admin", tags=["admin", "participation"])


@router.get("/participation", response_model=ParticipationData)
async def get_participation(
    admin: SessionUser = Depends(require_admin),
) -> ParticipationData:
    del admin
    with connection() as conn:
        p = period.get_period(conn)
        if p["state"] != "abierto":
            raise HTTPException(
                status_code=409,
                detail="Participación disponible sólo con el periodo abierto.",
            )
        # ÚNICA query sobre vote_receipts; NUNCA JOIN con vote_scores.
        rows = conn.execute(
            "SELECT user_email, voted_at FROM vote_receipts "
            "WHERE period_id = ? ORDER BY voted_at DESC, id DESC",
            (period.PERIOD_ID,),
        ).fetchall()
    voters = [
        VoterReceiptSummary(email=r["user_email"], voted_at=r["voted_at"]) for r in rows
    ]
    return ParticipationData(
        voters_count=len(voters),
        expected_quorum=p.get("expected_quorum"),
        voters=voters,
    )


@router.patch("/period/quorum", status_code=204)
async def set_quorum(
    payload: QuorumUpdateRequest,
    admin: SessionUser = Depends(require_admin),
) -> None:
    with connection() as conn, transaction(conn):
        period.set_quorum(
            conn,
            expected_quorum=payload.expected_quorum,
            admin_email=admin.email,
        )
