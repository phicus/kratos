"""US1 — GET /api/admin/dashboard."""

from __future__ import annotations


def test_dashboard_requires_admin(authed_client):
    r = authed_client.get("/api/admin/dashboard")
    assert r.status_code == 403


def test_dashboard_preparacion_empty(admin_client):
    r = admin_client.get("/api/admin/dashboard")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["period"]["state"] == "preparacion"
    assert data["period"]["expected_quorum"] is None
    assert data["counters"] == {
        "votable": 0,
        "excluded": 0,
        "merged_parent": 0,
        "ballots_cast": 0,
    }
    assert data["recent_audit"] == []


def test_dashboard_with_proposals_and_open_period(admin_client):
    # Seed
    for name in ("Alpha", "Beta", "Gamma"):
        r = admin_client.post("/api/admin/proposals", json={"name": name, "description": "d"})
        assert r.status_code == 201

    # Open
    assert admin_client.post("/api/admin/period/open").status_code == 204

    data = admin_client.get("/api/admin/dashboard").json()
    assert data["period"]["state"] == "abierto"
    assert data["period"]["opened_at"] is not None
    assert data["counters"]["votable"] == 3
    assert data["counters"]["ballots_cast"] == 0
    # Recent audit lists PERIOD_OPEN + 3 PROPOSAL_CREATE
    actions = [e["action"] for e in data["recent_audit"]]
    assert actions[0] == "PERIOD_OPEN"
    assert actions.count("PROPOSAL_CREATE") >= 1
    assert len(data["recent_audit"]) <= 5


def test_dashboard_ballots_cast_increases_on_vote(admin_client):
    from kratos.db import connection
    from kratos.models import ballot

    pid = admin_client.post("/api/admin/proposals", json={"name": "X", "description": "d"}).json()[
        "id"
    ]
    admin_client.post("/api/admin/period/open")

    with connection() as conn:
        ballot.submit(conn, user_email="u1@phicus.es", scores={pid: 9})

    data = admin_client.get("/api/admin/dashboard").json()
    assert data["counters"]["ballots_cast"] == 1
