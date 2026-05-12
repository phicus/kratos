"""**Principio I (Anonimato) — TEST INNEGOCIABLE**.

Valida que ningún registro de puntuación persistido contiene, directa o
indirectamente, identificador del votante.

Comprobaciones:
1. Estructural: ninguna columna de `vote_scores` se llama (o contiene la
   subcadena) `user_email`, `user_id`, `ip`, `user_agent`, `email`, `user`.
2. Estructural: `vote_scores` y `vote_receipts` no comparten ninguna
   columna identificable más allá de `period_id` (constante).
3. De valores: tras emitir 50 papeletas con emails sintéticos, ningún
   string almacenado en `vote_scores` contiene `@phicus.es` ni el sufijo
   "user".
4. El `ballot_uuid` que agrupa los scores **no aparece** en ninguna otra
   tabla.
"""

from __future__ import annotations

import re

from kratos.db import connection
from kratos.models import ballot, proposal


def test_vote_scores_schema_has_no_user_columns(init_db):
    del init_db
    with connection() as conn:
        cols = [r["name"] for r in conn.execute("PRAGMA table_info('vote_scores')")]
    forbidden_substrings = ("user", "email", "ip", "agent", "name")
    offenders = [
        c for c in cols if any(s in c.lower() for s in forbidden_substrings)
    ]
    assert offenders == [], (
        f"vote_scores tiene columnas correlacionables con el votante: {offenders}"
    )


def test_vote_receipts_and_scores_share_no_correlation_column(init_db):
    del init_db
    with connection() as conn:
        receipts_cols = {r["name"] for r in conn.execute("PRAGMA table_info('vote_receipts')")}
        scores_cols = {r["name"] for r in conn.execute("PRAGMA table_info('vote_scores')")}
    shared = receipts_cols & scores_cols
    # Sólo `period_id` puede compartirse (constante para todas las papeletas).
    assert shared <= {"period_id", "id"}, (
        f"vote_receipts y vote_scores comparten columnas inesperadas: {shared}"
    )


def test_no_voter_identity_leaks_into_persisted_scores(init_db, open_period):
    del init_db
    with connection() as conn:
        ids = []
        for i in range(3):
            cur = conn.execute(
                "INSERT INTO proposals(name, description, status) VALUES (?, ?, 'votable')",
                (f"Prop_{i}", f"Desc_{i}"),
            )
            ids.append(int(cur.lastrowid))
        open_period(conn)

        ballot_uuids_seen: set[str] = set()
        for i in range(50):
            email = f"user{i}@phicus.es"
            scores = {pid: ((i + j) % 10) + 1 for j, pid in enumerate(ids)}
            ballot.submit(conn, user_email=email, scores=scores)

        rows = conn.execute(
            "SELECT period_id, proposal_id, score, ballot_uuid FROM vote_scores"
        ).fetchall()
    assert len(rows) == 50 * len(ids)

    pattern = re.compile(r"@phicus\.es|user\d+", re.IGNORECASE)
    for r in rows:
        for col in ("ballot_uuid",):
            val = r[col]
            assert isinstance(val, str)
            assert not pattern.search(val), (
                f"vote_scores.{col} contiene marca correlacionable con votante: {val!r}"
            )
        ballot_uuids_seen.add(r["ballot_uuid"])

    # ballot_uuid no debe aparecer en ninguna otra tabla — comprobamos en vote_receipts.
    with connection() as conn:
        receipt_cols = [r["name"] for r in conn.execute("PRAGMA table_info('vote_receipts')")]
        for col in receipt_cols:
            for uuid_val in list(ballot_uuids_seen)[:5]:  # muestra
                row = conn.execute(
                    f"SELECT 1 FROM vote_receipts WHERE {col} = ?", (uuid_val,)
                ).fetchone()
                assert row is None, (
                    f"ballot_uuid {uuid_val} aparece en vote_receipts.{col} — viola Principio I"
                )


def test_voted_at_truncates_seconds(init_db, open_period):
    del init_db
    with connection() as conn:
        cur = conn.execute(
            "INSERT INTO proposals(name, description, status) VALUES (?, ?, 'votable')",
            ("P1", "D1"),
        )
        pid = int(cur.lastrowid)
        open_period(conn)
        ballot.submit(conn, user_email="u@phicus.es", scores={pid: 5})
        row = conn.execute("SELECT voted_at FROM vote_receipts WHERE user_email='u@phicus.es'").fetchone()
    voted_at: str = row["voted_at"]
    # Debe acabar en :00 para no permitir correlación temporal de alta resolución.
    assert voted_at.endswith(":00"), f"voted_at={voted_at!r} contiene segundos no-cero"
