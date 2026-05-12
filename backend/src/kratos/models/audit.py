"""Audit log append-only.

**Principio V**: este módulo sólo expone `append()`. Cualquier intento de
modificar o borrar entradas del log debe usar SQL directo y queda fuera
del flujo soportado.
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any

# Códigos de acción válidos. Se valida en append() para evitar drift.
VALID_ACTIONS: frozenset[str] = frozenset(
    {
        "PERIOD_OPEN",
        "PERIOD_CLOSE",
        "PERIOD_RESET",
        "PERIOD_QUORUM_SET",
        "PROPOSAL_CREATE",
        "PROPOSAL_EDIT",
        "PROPOSAL_EXCLUDE",
        "PROPOSAL_RESTORE",
        "PROPOSAL_MERGE",
        "PROPOSAL_UNMERGE",
        "PROPOSAL_BULK_EXCLUDE",
        "PROPOSAL_BULK_RESTORE",
        "RESULTS_EXPORT",
        "CSV_IMPORT",
    }
)


def append(
    conn: sqlite3.Connection,
    *,
    admin_email: str,
    action: str,
    target_ids: list[int] | None = None,
    period_state_before: str | None = None,
    period_state_after: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    if action not in VALID_ACTIONS:
        raise ValueError(f"Acción admin inválida: {action!r}")
    conn.execute(
        """
        INSERT INTO admin_audit_log
            (admin_email, action, target_ids, period_state_before, period_state_after, details)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            admin_email.lower(),
            action,
            json.dumps(target_ids) if target_ids is not None else None,
            period_state_before,
            period_state_after,
            json.dumps(details, ensure_ascii=False) if details else None,
        ),
    )


def list_entries(conn: sqlite3.Connection, *, limit: int = 200) -> list[dict[str, Any]]:
    limit = max(1, min(limit, 1000))
    rows = conn.execute(
        """
        SELECT admin_email, action, target_ids, period_state_before,
               period_state_after, details, occurred_at
        FROM admin_audit_log
        ORDER BY occurred_at DESC, id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "admin_email": r["admin_email"],
                "action": r["action"],
                "target_ids": json.loads(r["target_ids"]) if r["target_ids"] else None,
                "period_state_before": r["period_state_before"],
                "period_state_after": r["period_state_after"],
                "details": json.loads(r["details"]) if r["details"] else None,
                "occurred_at": r["occurred_at"],
            }
        )
    return out
