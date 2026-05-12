"""**Principio II (Unicidad atómica) — TEST INNEGOCIABLE**.

Valida que ningún usuario puede votar dos veces, incluso bajo concurrencia.

Estrategia: 100 hilos intentan emitir simultáneamente la papeleta del mismo
usuario. Tras esperar a todos, debe quedar exactamente 1 receipt y exactamente
N scores (donde N = número de propuestas votables).
"""

from __future__ import annotations

import threading

import pytest
from fastapi import HTTPException

from kratos.db import connection
from kratos.models import ballot


@pytest.fixture
def setup(init_db, open_period):
    del init_db
    with connection() as conn:
        ids = []
        for i in range(5):
            cur = conn.execute(
                "INSERT INTO proposals(name, description, status) VALUES (?, ?, 'votable')",
                (f"P{i}", f"D{i}"),
            )
            ids.append(int(cur.lastrowid))
        open_period(conn)
    return ids


def test_double_vote_rejected_sequentially(setup):
    ids = setup
    scores = {pid: 5 for pid in ids}
    with connection() as conn:
        ballot.submit(conn, user_email="repeat@phicus.es", scores=scores)
    with connection() as conn, pytest.raises(HTTPException) as exc:
        ballot.submit(conn, user_email="repeat@phicus.es", scores=scores)
    assert exc.value.status_code == 409


def test_concurrent_double_votes_yield_exactly_one_receipt(setup):
    ids = setup
    scores_template = {pid: 7 for pid in ids}
    email = "race@phicus.es"

    threads_count = 100
    successes: list[bool] = []
    errors: list[Exception] = []
    barrier = threading.Barrier(threads_count)

    def worker():
        try:
            barrier.wait(timeout=10)
            with connection() as conn:
                ballot.submit(conn, user_email=email, scores=dict(scores_template))
            successes.append(True)
        except Exception as exc:
            errors.append(exc)

    threads = [threading.Thread(target=worker) for _ in range(threads_count)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    # Exactamente 1 receipt
    with connection() as conn:
        receipts = conn.execute(
            "SELECT COUNT(*) AS c FROM vote_receipts WHERE user_email=?", (email,)
        ).fetchone()["c"]
        scores_rows = conn.execute("SELECT COUNT(*) AS c FROM vote_scores").fetchone()["c"]
    assert receipts == 1, f"Esperado 1 receipt, encontrados {receipts}"
    assert scores_rows == len(ids), (
        f"Esperado {len(ids)} scores (1 papeleta), encontrados {scores_rows} — "
        "indica que múltiples papeletas se persistieron parcialmente"
    )
    assert len(successes) == 1, (
        f"Esperado 1 éxito ({len(successes)} encontrados) y {threads_count - 1} fallos "
        f"({len(errors)} errores)"
    )
