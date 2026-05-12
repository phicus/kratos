"""GET /api/me — identidad del usuario actual + flags relevantes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth.deps import require_user
from ..auth.session import SessionUser
from ..db import connection
from ..models import ballot, period
from ..models.schemas import Me

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me", response_model=Me)
async def me(user: SessionUser = Depends(require_user)) -> Me:
    with connection() as conn:
        return Me(
            email=user.email,
            is_admin=user.is_admin,
            has_voted=ballot.has_voted(conn, user.email),
            period_state=period.get_state(conn),
        )
