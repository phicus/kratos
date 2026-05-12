"""POST /api/ballot — emisión de papeleta anónima y única.

Rate-limit ligero por email (10 req/min) implementado in-memory.
Suficiente para el volumen objetivo (≤500 votantes) y respeta el Principio
IV (sin colas/redis). En producción multi-instancia debería migrar a un
store compartido, pero el plan es un único proceso.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException

from ..auth.deps import require_user
from ..auth.session import SessionUser
from ..db import connection
from ..models import ballot as ballot_model
from ..models.schemas import BallotRequest

router = APIRouter(prefix="/api", tags=["ballot"])

_RATE_WINDOW_SECONDS = 60
_RATE_MAX_REQUESTS = 10
_rate_hits: dict[str, deque[float]] = defaultdict(deque)


def _check_rate_limit(email: str) -> None:
    now = time.monotonic()
    hits = _rate_hits[email]
    cutoff = now - _RATE_WINDOW_SECONDS
    while hits and hits[0] < cutoff:
        hits.popleft()
    if len(hits) >= _RATE_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Demasiadas peticiones; espera {_RATE_WINDOW_SECONDS}s.",
        )
    hits.append(now)


@router.post("/ballot", status_code=201)
async def submit_ballot(
    payload: BallotRequest,
    user: SessionUser = Depends(require_user),
) -> dict:
    _check_rate_limit(user.email)
    scores: dict[int, int] = {}
    for item in payload.scores:
        if item.proposal_id in scores:
            raise HTTPException(
                status_code=422,
                detail=f"Puntuación duplicada para proposal_id={item.proposal_id}",
            )
        scores[item.proposal_id] = item.score
    with connection() as conn:
        ballot_model.submit(conn, user_email=user.email, scores=scores)
    return {"status": "ok"}
