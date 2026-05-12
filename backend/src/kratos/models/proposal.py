"""Acceso a propuestas: lectura, edición, exclusión, fusión, import CSV."""

from __future__ import annotations

import csv
import sqlite3
from io import StringIO
from typing import Iterable

from . import audit

CSV_HEADERS = {
    "name": "¿Cuál sería el nombre de la idea/proyecto?",
    "description": "Describe cual es el objetivo de la idea/proyecto. ¿Qué soluciona o facilita?",
    "how": "¿Sabrías explicar como lo harías? (OPCIONAL)",
    "time_estimate": (
        "¿Podrías estimar si se podría hacer en un día o se necesitarían varios? "
        "(OPCIONAL, sólo si sabes cómo se haría)"
    ),
    "author": "Dirección de correo electrónico",
}


def _row_to_proposal(row: sqlite3.Row, parent_ids: list[int] | None = None) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "how": row["how"],
        "time_estimate": row["time_estimate"],
        "original_author_email": row["original_author_email"],
        "status": row["status"],
        "parent_ids": parent_ids or [],
    }


def _parent_ids_for(conn: sqlite3.Connection, proposal_id: int) -> list[int]:
    rows = conn.execute(
        "SELECT parent_proposal_id FROM proposal_merges WHERE merged_proposal_id=? ORDER BY parent_proposal_id",
        (proposal_id,),
    ).fetchall()
    return [r["parent_proposal_id"] for r in rows]


def list_for_voter(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM proposals WHERE status='votable' ORDER BY name COLLATE NOCASE ASC"
    ).fetchall()
    return [_row_to_proposal(r, _parent_ids_for(conn, r["id"])) for r in rows]


def list_for_admin(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM proposals ORDER BY status='excluded', status='merged_parent', name COLLATE NOCASE ASC"
    ).fetchall()
    return [_row_to_proposal(r, _parent_ids_for(conn, r["id"])) for r in rows]


def get(conn: sqlite3.Connection, proposal_id: int) -> dict | None:
    row = conn.execute("SELECT * FROM proposals WHERE id=?", (proposal_id,)).fetchone()
    if not row:
        return None
    return _row_to_proposal(row, _parent_ids_for(conn, proposal_id))


def create(
    conn: sqlite3.Connection,
    *,
    name: str,
    description: str,
    how: str | None = None,
    time_estimate: str | None = None,
    original_author_email: str | None = None,
    status: str = "votable",
) -> int:
    cur = conn.execute(
        """
        INSERT INTO proposals
            (name, description, how, time_estimate, original_author_email, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (name.strip(), description.strip(), how, time_estimate, original_author_email, status),
    )
    return int(cur.lastrowid)


def edit(
    conn: sqlite3.Connection,
    proposal_id: int,
    *,
    name: str | None = None,
    description: str | None = None,
    how: str | None = None,
    time_estimate: str | None = None,
) -> None:
    fields: list[str] = []
    values: list[object] = []
    for col, val in (
        ("name", name),
        ("description", description),
        ("how", how),
        ("time_estimate", time_estimate),
    ):
        if val is not None:
            fields.append(f"{col}=?")
            values.append(val)
    if not fields:
        return
    fields.append("updated_at=datetime('now')")
    values.append(proposal_id)
    conn.execute(f"UPDATE proposals SET {', '.join(fields)} WHERE id=?", values)


def set_status(conn: sqlite3.Connection, proposal_id: int, *, status: str) -> None:
    conn.execute(
        "UPDATE proposals SET status=?, updated_at=datetime('now') WHERE id=?",
        (status, proposal_id),
    )


def bulk_set_status(
    conn: sqlite3.Connection,
    *,
    proposal_ids: list[int],
    target_status: str,
    admin_email: str,
) -> dict:
    """Cambia el status de N propuestas en una sola transacción.

    Reglas:
    - target_status='excluded' sólo aplica a propuestas en 'votable'.
    - target_status='votable' sólo aplica a propuestas en 'excluded'.
    - Las que no cumplan se devuelven en `skipped` con motivo.
    - Genera un `bulk_group_id` corto compartido por todas las entradas de audit.
    - Para cada propuesta afectada, emite UNA entrada de audit individual
      (PROPOSAL_EXCLUDE / PROPOSAL_RESTORE) con `details.bulk_group_id`.

    Caller debe estar dentro de transaction(immediate=True).
    """
    import uuid

    from fastapi import HTTPException

    from . import audit

    if target_status == "excluded":
        valid_from = "votable"
        action = "PROPOSAL_EXCLUDE"
    elif target_status == "votable":
        valid_from = "excluded"
        action = "PROPOSAL_RESTORE"
    else:
        raise HTTPException(status_code=422, detail=f"target_status inválido: {target_status}")

    if not proposal_ids:
        raise HTTPException(status_code=422, detail="proposal_ids no puede estar vacío.")

    placeholders = ",".join("?" for _ in proposal_ids)
    rows = conn.execute(
        f"SELECT id, status FROM proposals WHERE id IN ({placeholders})",
        proposal_ids,
    ).fetchall()
    existing = {r["id"]: r["status"] for r in rows}

    bulk_group_id = uuid.uuid4().hex[:8]
    affected_ids: list[int] = []
    skipped: list[dict] = []

    for pid in proposal_ids:
        current = existing.get(pid)
        if current is None:
            skipped.append({"proposal_id": pid, "reason": "not_found"})
            continue
        if current != valid_from:
            skipped.append({"proposal_id": pid, "reason": f"not_{valid_from}"})
            continue
        affected_ids.append(pid)

    if affected_ids:
        conn.executemany(
            "UPDATE proposals SET status=?, updated_at=datetime('now') WHERE id=?",
            [(target_status, pid) for pid in affected_ids],
        )
        for pid in affected_ids:
            audit.append(
                conn,
                admin_email=admin_email,
                action=action,
                target_ids=[pid],
                details={"bulk_group_id": bulk_group_id},
            )

    return {
        "affected": len(affected_ids),
        "bulk_group_id": bulk_group_id,
        "skipped": skipped,
    }


def merge(
    conn: sqlite3.Connection,
    *,
    parent_ids: list[int],
    name: str,
    description: str,
    how: str | None,
    time_estimate: str | None,
    admin_email: str,
) -> int:
    if len(parent_ids) < 2:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Se requieren al menos 2 propuestas padre.")
    placeholders = ",".join("?" for _ in parent_ids)
    parents = conn.execute(
        f"SELECT id, status FROM proposals WHERE id IN ({placeholders})",
        parent_ids,
    ).fetchall()
    if len(parents) != len(parent_ids):
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Alguna propuesta padre no existe.")
    if any(p["status"] != "votable" for p in parents):
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail="Todas las propuestas padre deben ser 'votable'.")
    child_id = create(
        conn,
        name=name,
        description=description,
        how=how,
        time_estimate=time_estimate,
        status="votable",
    )
    conn.executemany(
        """
        INSERT INTO proposal_merges (merged_proposal_id, parent_proposal_id, merged_by)
        VALUES (?, ?, ?)
        """,
        [(child_id, pid, admin_email) for pid in parent_ids],
    )
    conn.executemany(
        "UPDATE proposals SET status='merged_parent', updated_at=datetime('now') WHERE id=?",
        [(pid,) for pid in parent_ids],
    )
    return child_id


def unmerge(conn: sqlite3.Connection, proposal_id: int) -> list[int]:
    parents = _parent_ids_for(conn, proposal_id)
    if not parents:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="La propuesta no es resultado de un merge.")
    conn.execute("DELETE FROM proposal_merges WHERE merged_proposal_id=?", (proposal_id,))
    conn.executemany(
        "UPDATE proposals SET status='votable', updated_at=datetime('now') WHERE id=?",
        [(p,) for p in parents],
    )
    conn.execute("DELETE FROM proposals WHERE id=?", (proposal_id,))
    return parents


def import_csv_text(
    conn: sqlite3.Connection, csv_text: str, *, admin_email: str
) -> tuple[int, int]:
    """Importa propuestas desde texto CSV. Idempotente por (name, original_author_email).

    Devuelve (imported, skipped).
    """
    reader = csv.DictReader(StringIO(csv_text))
    imported = 0
    skipped = 0
    for row in reader:
        name = (row.get(CSV_HEADERS["name"]) or "").strip()
        description = (row.get(CSV_HEADERS["description"]) or "").strip()
        if not name or not description:
            skipped += 1
            continue
        author = (row.get(CSV_HEADERS["author"]) or "").strip().lower() or None
        if author and not author.endswith("@phicus.es"):
            skipped += 1
            continue
        existing = conn.execute(
            "SELECT id FROM proposals WHERE name=? AND COALESCE(original_author_email,'')=COALESCE(?, '')",
            (name, author),
        ).fetchone()
        if existing:
            skipped += 1
            continue
        how = (row.get(CSV_HEADERS["how"]) or "").strip() or None
        time_estimate = (row.get(CSV_HEADERS["time_estimate"]) or "").strip() or None
        create(
            conn,
            name=name,
            description=description,
            how=how,
            time_estimate=time_estimate,
            original_author_email=author,
        )
        imported += 1
    audit.append(
        conn,
        admin_email=admin_email,
        action="CSV_IMPORT",
        details={"imported": imported, "skipped": skipped},
    )
    return imported, skipped


def import_csv_rows(
    conn: sqlite3.Connection, rows: Iterable[dict], *, admin_email: str
) -> tuple[int, int]:
    """Variante para tests: acepta filas ya parseadas con las mismas claves del CSV."""
    text = StringIO()
    fieldnames = list(CSV_HEADERS.values())
    writer = csv.DictWriter(text, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow(r)
    return import_csv_text(conn, text.getvalue(), admin_email=admin_email)
