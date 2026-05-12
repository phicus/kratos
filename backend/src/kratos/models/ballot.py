"""Emisión de papeleta — el núcleo de los Principios I y II.

- **Anonimato (Principio I)**: el receipt persiste `user_email`; los scores se
  persisten con un `ballot_uuid` aleatorio que **no se conserva en ninguna
  otra tabla**. La unión receipt↔scores es imposible tras commit.
- **Unicidad atómica (Principio II)**: `BEGIN IMMEDIATE` + UNIQUE constraint
  sobre `vote_receipts(user_email, period_id)`. Cualquier segundo intento
  falla en el INSERT del receipt y ROLLBACK descarta los scores parciales.
"""

from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from ..db import transaction
from . import period as period_mod

PERIOD_ID = period_mod.PERIOD_ID


def _truncate_to_minute() -> str:
    """Timestamp UTC ISO con segundos=00 (Principio I: sin alta resolución)."""
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    # Formato sin tz suffix para coincidir con datetime('now') de SQLite
    return now.strftime("%Y-%m-%d %H:%M:00")


def list_votable_ids(conn: sqlite3.Connection) -> set[int]:
    rows = conn.execute("SELECT id FROM proposals WHERE status='votable'").fetchall()
    return {r["id"] for r in rows}


def has_voted(conn: sqlite3.Connection, email: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM vote_receipts WHERE user_email=? AND period_id=?",
        (email.lower(), PERIOD_ID),
    ).fetchone()
    return row is not None


def submit(
    conn: sqlite3.Connection,
    *,
    user_email: str,
    scores: dict[int, int],
) -> None:
    """Inserta receipt + scores atómicamente.

    Lanza HTTPException con códigos:
    - 403 si el periodo no está abierto.
    - 409 ALREADY_VOTED si el usuario ya votó (UNIQUE violation).
    - 422 si la cobertura de propuestas no es exacta o hay scores fuera de rango.
    """
    user_email = user_email.lower().strip()

    # Validación previa fuera de la transacción para fallar rápido y con buen mensaje.
    state = period_mod.get_state(conn)
    if state != "abierto":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"El periodo de votación no está abierto (estado actual: {state}).",
        )
    votable = list_votable_ids(conn)
    if set(scores.keys()) != votable:
        missing = sorted(votable - set(scores.keys()))
        unexpected = sorted(set(scores.keys()) - votable)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "La papeleta debe cubrir exactamente las propuestas votables.",
                "missing": missing,
                "unexpected": unexpected,
            },
        )
    for s in scores.values():
        if not (1 <= s <= 10):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Las puntuaciones deben estar entre 1 y 10.",
            )

    voted_at = _truncate_to_minute()
    ballot_uuid = uuid.uuid4().hex

    try:
        with transaction(conn, immediate=True):
            conn.execute(
                "INSERT INTO vote_receipts (user_email, period_id, voted_at) VALUES (?, ?, ?)",
                (user_email, PERIOD_ID, voted_at),
            )
            conn.executemany(
                """
                INSERT INTO vote_scores (period_id, proposal_id, score, ballot_uuid)
                VALUES (?, ?, ?, ?)
                """,
                [(PERIOD_ID, pid, score, ballot_uuid) for pid, score in scores.items()],
            )
    except sqlite3.IntegrityError as exc:
        # UNIQUE (user_email, period_id) violado → ya votó.
        if "vote_receipts" in str(exc) or "UNIQUE" in str(exc).upper():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"detail": "Ya has votado en este periodo.", "code": "ALREADY_VOTED"},
            ) from exc
        raise
