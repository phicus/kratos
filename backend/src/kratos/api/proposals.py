"""GET /api/proposals — listado de propuestas para el votante."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth.deps import require_user
from ..auth.session import SessionUser
from ..db import connection
from ..models import period, proposal
from ..models.schemas import Proposal

router = APIRouter(prefix="/api", tags=["proposals"])


@router.get("/proposals", response_model=list[Proposal])
async def list_proposals(user: SessionUser = Depends(require_user)) -> list[Proposal]:
    with connection() as conn:
        state = period.get_state(conn)
        if user.is_admin and state == "preparacion":
            rows = proposal.list_for_admin(conn)
        else:
            rows = proposal.list_for_voter(conn)
    return [Proposal(**r) for r in rows]
