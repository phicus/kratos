"""Transiciones del periodo + auditoría (US2)."""

from __future__ import annotations


def _state(client) -> str:
    return client.get("/api/period").json()["state"]


def _audit(client) -> list[dict]:
    return client.get("/api/admin/audit-log").json()


def test_only_admin_can_transition(authed_client):
    # Usuario normal: 403
    assert authed_client.post("/api/admin/period/open").status_code == 403


def test_full_cycle_open_close_reset(admin_client):
    assert _state(admin_client) == "preparacion"

    # open: preparacion → abierto
    r = admin_client.post("/api/admin/period/open")
    assert r.status_code == 204
    assert _state(admin_client) == "abierto"

    # double-open desde abierto → 409
    assert admin_client.post("/api/admin/period/open").status_code == 409

    # close: abierto → cerrado
    assert admin_client.post("/api/admin/period/close").status_code == 204
    assert _state(admin_client) == "cerrado"

    # reset: cerrado → preparacion
    assert admin_client.post("/api/admin/period/reset").status_code == 204
    assert _state(admin_client) == "preparacion"

    # Open from cerrado (no-op): debe ser 409 (estado origen != preparacion)
    # — pero ya estamos en preparacion, así que reabrimos para probar close inválido
    assert admin_client.post("/api/admin/period/close").status_code == 409

    audit = _audit(admin_client)
    actions = [e["action"] for e in audit]
    assert actions[-3:] == ["PERIOD_RESET", "PERIOD_CLOSE", "PERIOD_OPEN"]


def test_reset_purges_ballots_and_receipts(admin_client):
    # Seed propuestas + abrir + votar + cerrar + reset
    from kratos.db import connection
    from kratos.models import ballot

    with connection() as conn:
        cur = conn.execute(
            "INSERT INTO proposals(name, description, status) VALUES (?, ?, 'votable')",
            ("Una propuesta", "Desc"),
        )
        pid = int(cur.lastrowid)

    admin_client.post("/api/admin/period/open")
    with connection() as conn:
        ballot.submit(conn, user_email="x@phicus.es", scores={pid: 9})

    admin_client.post("/api/admin/period/close")
    admin_client.post("/api/admin/period/reset")

    with connection() as conn:
        rcount = conn.execute("SELECT COUNT(*) AS c FROM vote_receipts").fetchone()["c"]
        scount = conn.execute("SELECT COUNT(*) AS c FROM vote_scores").fetchone()["c"]
    assert rcount == 0
    assert scount == 0

    # Audit conserva el reset con counts purgados
    audit = _audit(admin_client)
    reset = next(e for e in audit if e["action"] == "PERIOD_RESET")
    assert reset["details"]["purged_receipts"] == 1
    assert reset["details"]["purged_scores"] == 1
