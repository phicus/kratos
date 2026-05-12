"""Endpoints admin para gestión de propuestas (CRUD, exclude, merge, import)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth.deps import require_admin
from ..auth.session import SessionUser
from ..db import connection, transaction
from ..models import audit, period, proposal
from ..models.schemas import (
    BulkProposalsRequest,
    BulkProposalsResult,
    ImportCsvResult,
    Proposal,
    ProposalCreate,
    ProposalEdit,
    ProposalMergeRequest,
)

router = APIRouter(prefix="/api/admin/proposals", tags=["admin", "proposals"])


def _require_preparacion(conn) -> str:
    state = period.get_state(conn)
    if state != "preparacion":
        raise HTTPException(
            status_code=409,
            detail=f"Las propuestas sólo se pueden modificar con el periodo en 'preparacion' (actual: {state}).",
        )
    return state


@router.post("", response_model=Proposal, status_code=201)
async def create_proposal(
    payload: ProposalCreate, admin: SessionUser = Depends(require_admin)
) -> Proposal:
    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        new_id = proposal.create(
            conn,
            name=payload.name,
            description=payload.description,
            how=payload.how,
            time_estimate=payload.time_estimate,
        )
        audit.append(
            conn,
            admin_email=admin.email,
            action="PROPOSAL_CREATE",
            target_ids=[new_id],
            details={"name": payload.name},
        )
        result = proposal.get(conn, new_id)
    assert result is not None
    return Proposal(**result)


@router.patch("/{proposal_id}", response_model=Proposal)
async def edit_proposal(
    proposal_id: int,
    payload: ProposalEdit,
    admin: SessionUser = Depends(require_admin),
) -> Proposal:
    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        existing = proposal.get(conn, proposal_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Propuesta no encontrada.")
        proposal.edit(
            conn,
            proposal_id,
            name=payload.name,
            description=payload.description,
            how=payload.how,
            time_estimate=payload.time_estimate,
        )
        audit.append(
            conn,
            admin_email=admin.email,
            action="PROPOSAL_EDIT",
            target_ids=[proposal_id],
            details=payload.model_dump(exclude_none=True),
        )
        updated = proposal.get(conn, proposal_id)
    assert updated is not None
    return Proposal(**updated)


@router.post("/{proposal_id}/exclude", status_code=204)
async def exclude_proposal(
    proposal_id: int, admin: SessionUser = Depends(require_admin)
) -> None:
    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        existing = proposal.get(conn, proposal_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Propuesta no encontrada.")
        if existing["status"] != "votable":
            raise HTTPException(
                status_code=409, detail="Sólo se pueden excluir propuestas votables."
            )
        proposal.set_status(conn, proposal_id, status="excluded")
        audit.append(
            conn,
            admin_email=admin.email,
            action="PROPOSAL_EXCLUDE",
            target_ids=[proposal_id],
        )


@router.post("/{proposal_id}/restore", status_code=204)
async def restore_proposal(
    proposal_id: int, admin: SessionUser = Depends(require_admin)
) -> None:
    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        existing = proposal.get(conn, proposal_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Propuesta no encontrada.")
        if existing["status"] != "excluded":
            raise HTTPException(
                status_code=409, detail="Sólo se pueden restaurar propuestas excluidas."
            )
        proposal.set_status(conn, proposal_id, status="votable")
        audit.append(
            conn,
            admin_email=admin.email,
            action="PROPOSAL_RESTORE",
            target_ids=[proposal_id],
        )


@router.post("/merge", response_model=Proposal, status_code=201)
async def merge_proposals(
    payload: ProposalMergeRequest, admin: SessionUser = Depends(require_admin)
) -> Proposal:
    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        child_id = proposal.merge(
            conn,
            parent_ids=payload.parent_ids,
            name=payload.name,
            description=payload.description,
            how=payload.how,
            time_estimate=payload.time_estimate,
            admin_email=admin.email,
        )
        audit.append(
            conn,
            admin_email=admin.email,
            action="PROPOSAL_MERGE",
            target_ids=[child_id, *payload.parent_ids],
            details={"name": payload.name, "parents": payload.parent_ids},
        )
        result = proposal.get(conn, child_id)
    assert result is not None
    return Proposal(**result)


@router.post("/{proposal_id}/unmerge", status_code=204)
async def unmerge_proposal(
    proposal_id: int, admin: SessionUser = Depends(require_admin)
) -> None:
    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        parents = proposal.unmerge(conn, proposal_id)
        audit.append(
            conn,
            admin_email=admin.email,
            action="PROPOSAL_UNMERGE",
            target_ids=[proposal_id, *parents],
        )


@router.post("/bulk-exclude", response_model=BulkProposalsResult)
async def bulk_exclude(
    payload: BulkProposalsRequest,
    admin: SessionUser = Depends(require_admin),
) -> BulkProposalsResult:
    with connection() as conn, transaction(conn, immediate=True):
        _require_preparacion(conn)
        result = proposal.bulk_set_status(
            conn,
            proposal_ids=payload.proposal_ids,
            target_status="excluded",
            admin_email=admin.email,
        )
    return BulkProposalsResult(**result)


@router.post("/bulk-restore", response_model=BulkProposalsResult)
async def bulk_restore(
    payload: BulkProposalsRequest,
    admin: SessionUser = Depends(require_admin),
) -> BulkProposalsResult:
    with connection() as conn, transaction(conn, immediate=True):
        _require_preparacion(conn)
        result = proposal.bulk_set_status(
            conn,
            proposal_ids=payload.proposal_ids,
            target_status="votable",
            admin_email=admin.email,
        )
    return BulkProposalsResult(**result)


@router.post("/import", response_model=ImportCsvResult)
async def import_proposals(
    file: UploadFile = File(...),
    admin: SessionUser = Depends(require_admin),
) -> ImportCsvResult:
    raw = await file.read()
    try:
        csv_text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=422, detail="El CSV debe estar codificado en UTF-8."
        ) from exc

    with connection() as conn, transaction(conn):
        _require_preparacion(conn)
        imported, skipped = proposal.import_csv_text(
            conn, csv_text, admin_email=admin.email
        )
    return ImportCsvResult(imported=imported, skipped=skipped)
