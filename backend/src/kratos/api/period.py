"""GET /api/period — estado público del periodo (sin auth required)."""

from __future__ import annotations

from fastapi import APIRouter

from ..db import connection
from ..models import period as period_mod
from ..models.schemas import Period

router = APIRouter(prefix="/api", tags=["period"])


@router.get("/period", response_model=Period)
async def get_period() -> Period:
    with connection() as conn:
        p = period_mod.get_period(conn)
    return Period(state=p["state"], opened_at=p["opened_at"], closed_at=p["closed_at"])
