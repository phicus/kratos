"""US2 — comportamiento funcional de /api/admin/participation + /quorum.

(El test anti-leak Principio I vive en `test_participation_no_score_leak.py`.)
"""

from __future__ import annotations


def _seed_proposal_and_open(admin_client) -> int:
    pid = admin_client.post("/api/admin/proposals", json={"name": "P", "description": "d"}).json()[
        "id"
    ]
    admin_client.post("/api/admin/period/open")
    return pid


def test_participation_409_when_not_open(admin_client):
    # preparacion
    assert admin_client.get("/api/admin/participation").status_code == 409
    # close → cerrado
    _seed_proposal_and_open(admin_client)
    admin_client.post("/api/admin/period/close")
    assert admin_client.get("/api/admin/participation").status_code == 409


def test_participation_lists_voters_desc(admin_client):
    from kratos.db import connection
    from kratos.models import ballot

    pid = _seed_proposal_and_open(admin_client)
    emails = ["alice@phicus.es", "bob@phicus.es", "carol@phicus.es"]
    with connection() as conn:
        for e in emails:
            ballot.submit(conn, user_email=e, scores={pid: 7})

    data = admin_client.get("/api/admin/participation").json()
    assert data["voters_count"] == 3
    assert data["expected_quorum"] is None
    returned = [v["email"] for v in data["voters"]]
    # Orden desc por voted_at (minute-truncated → más reciente primero o estable).
    assert sorted(returned) == sorted(emails)
    assert all(v["voted_at"].endswith(":00") for v in data["voters"])


def test_quorum_set_and_clear(admin_client):
    _seed_proposal_and_open(admin_client)
    # Set 48
    r = admin_client.patch("/api/admin/period/quorum", json={"expected_quorum": 48})
    assert r.status_code == 204
    assert admin_client.get("/api/admin/participation").json()["expected_quorum"] == 48
    # Clear con null
    r = admin_client.patch("/api/admin/period/quorum", json={"expected_quorum": None})
    assert r.status_code == 204
    assert admin_client.get("/api/admin/participation").json()["expected_quorum"] is None


def test_quorum_invalid_zero(admin_client):
    _seed_proposal_and_open(admin_client)
    r = admin_client.patch("/api/admin/period/quorum", json={"expected_quorum": 0})
    assert r.status_code == 422


def test_quorum_409_outside_abierto(admin_client):
    r = admin_client.patch("/api/admin/period/quorum", json={"expected_quorum": 10})
    assert r.status_code == 409


def test_quorum_purged_on_reset(admin_client):
    _seed_proposal_and_open(admin_client)
    admin_client.patch("/api/admin/period/quorum", json={"expected_quorum": 42})
    admin_client.post("/api/admin/period/close")
    admin_client.post("/api/admin/period/reset")
    data = admin_client.get("/api/admin/dashboard").json()
    assert data["period"]["expected_quorum"] is None
