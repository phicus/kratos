"""Helpers para leer y mutar el estado del periodo de votación."""

from __future__ import annotations

import sqlite3
from typing import Literal

from . import audit

PeriodState = Literal["preparacion", "abierto", "cerrado"]
PERIOD_ID = 1

ALLOWED_TRANSITIONS: dict[PeriodState, PeriodState] = {
    "preparacion": "abierto",
    "abierto": "cerrado",
    "cerrado": "preparacion",
}

ACTION_BY_TRANSITION: dict[tuple[PeriodState, PeriodState], str] = {
    ("preparacion", "abierto"): "PERIOD_OPEN",
    ("abierto", "cerrado"): "PERIOD_CLOSE",
    ("cerrado", "preparacion"): "PERIOD_RESET",
}


def get_period(conn: sqlite3.Connection) -> dict:
    row = conn.execute(
        "SELECT state, opened_at, closed_at, opened_by, closed_by, expected_quorum "
        "FROM periods WHERE id = ?",
        (PERIOD_ID,),
    ).fetchone()
    if row is None:
        # Defensive: la migración inserta la fila; si falta, repoblar.
        conn.execute("INSERT INTO periods(id, state) VALUES (?, 'preparacion')", (PERIOD_ID,))
        return {
            "state": "preparacion",
            "opened_at": None,
            "closed_at": None,
            "opened_by": None,
            "closed_by": None,
            "expected_quorum": None,
        }
    return dict(row)


def get_state(conn: sqlite3.Connection) -> PeriodState:
    return get_period(conn)["state"]


def transition(
    conn: sqlite3.Connection,
    *,
    expected_from: PeriodState,
    to_state: PeriodState,
    admin_email: str,
) -> dict:
    """Aplica la transición + audit log. Caller debe estar dentro de transaction()."""
    period = get_period(conn)
    current: PeriodState = period["state"]  # type: ignore[assignment]
    if current != expected_from:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail=f"Estado del periodo debe ser '{expected_from}', es '{current}'.",
        )
    if ALLOWED_TRANSITIONS.get(current) != to_state:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409, detail=f"Transición {current} → {to_state} no permitida."
        )

    if to_state == "abierto":
        conn.execute(
            "UPDATE periods SET state=?, opened_at=datetime('now'), opened_by=? WHERE id=?",
            (to_state, admin_email, PERIOD_ID),
        )
    elif to_state == "cerrado":
        conn.execute(
            "UPDATE periods SET state=?, closed_at=datetime('now'), closed_by=? WHERE id=?",
            (to_state, admin_email, PERIOD_ID),
        )
    elif to_state == "preparacion":
        # Reset: limpiamos papeletas y receipts del ciclo anterior.
        purged_receipts = conn.execute(
            "DELETE FROM vote_receipts WHERE period_id=?", (PERIOD_ID,)
        ).rowcount
        purged_scores = conn.execute(
            "DELETE FROM vote_scores WHERE period_id=?", (PERIOD_ID,)
        ).rowcount
        conn.execute(
            "UPDATE periods SET state=?, opened_at=NULL, closed_at=NULL, "
            "opened_by=NULL, closed_by=NULL, expected_quorum=NULL WHERE id=?",
            (to_state, PERIOD_ID),
        )
        action = ACTION_BY_TRANSITION[(current, to_state)]
        audit.append(
            conn,
            admin_email=admin_email,
            action=action,
            period_state_before=current,
            period_state_after=to_state,
            details={"purged_receipts": purged_receipts, "purged_scores": purged_scores},
        )
        return get_period(conn)

    action = ACTION_BY_TRANSITION[(current, to_state)]
    audit.append(
        conn,
        admin_email=admin_email,
        action=action,
        period_state_before=current,
        period_state_after=to_state,
    )
    return get_period(conn)


def set_quorum(
    conn: sqlite3.Connection,
    *,
    expected_quorum: int | None,
    admin_email: str,
) -> dict:
    """Establece o limpia el aforo esperado del periodo abierto.

    Caller debe estar dentro de transaction(). Disponible sólo con estado
    'abierto'. Loguea PERIOD_QUORUM_SET con old/new en details.
    """
    from fastapi import HTTPException

    if expected_quorum is not None and expected_quorum < 1:
        raise HTTPException(
            status_code=422,
            detail="expected_quorum debe ser un entero >= 1 o null.",
        )
    period = get_period(conn)
    if period["state"] != "abierto":
        raise HTTPException(
            status_code=409,
            detail="El aforo sólo se puede configurar con el periodo abierto.",
        )
    old = period["expected_quorum"]
    conn.execute(
        "UPDATE periods SET expected_quorum=? WHERE id=?",
        (expected_quorum, PERIOD_ID),
    )
    audit.append(
        conn,
        admin_email=admin_email,
        action="PERIOD_QUORUM_SET",
        details={"old": old, "new": expected_quorum},
    )
    return get_period(conn)
