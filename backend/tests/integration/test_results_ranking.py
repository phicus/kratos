"""US4 — Ranking final ordenado y desempate alfabético."""

from __future__ import annotations


def _create(client, name: str) -> int:
    r = client.post("/api/admin/proposals", json={"name": name, "description": "x"})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_results_unavailable_until_period_closed(admin_client):
    r = admin_client.get("/api/results")
    assert r.status_code == 409


def test_results_public_without_auth_when_closed(admin_client, app):
    """El ranking final es público una vez cerrado el periodo."""
    pid = _create(admin_client, "P pública")
    from kratos.db import connection
    from kratos.models import ballot

    admin_client.post("/api/admin/period/open")
    with connection() as conn:
        ballot.submit(conn, user_email="u@phicus.es", scores={pid: 7})
    admin_client.post("/api/admin/period/close")

    # Cliente NUEVO sin cookie de sesión
    from fastapi.testclient import TestClient

    anon = TestClient(app)
    r = anon.get("/api/results")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["period_state"] == "cerrado"
    assert any(e["name"] == "P pública" for e in data["entries"])


def test_results_public_returns_409_when_not_closed(app):
    """Sin sesión y periodo no cerrado: 409 (no 401)."""
    from fastapi.testclient import TestClient

    anon = TestClient(app)
    r = anon.get("/api/results")
    assert r.status_code == 409


def test_results_csv_still_admin_only_after_publicization(app, admin_client):
    """El CSV admin sigue siendo admin-only aunque /api/results sea público."""
    pid = _create(admin_client, "Solo")
    from kratos.db import connection
    from kratos.models import ballot

    admin_client.post("/api/admin/period/open")
    with connection() as conn:
        ballot.submit(conn, user_email="u@phicus.es", scores={pid: 5})
    admin_client.post("/api/admin/period/close")

    from fastapi.testclient import TestClient

    anon = TestClient(app)
    r = anon.get("/api/results.csv")
    assert r.status_code == 401  # sin sesión

    # Usuario autenticado pero no admin
    non_admin = TestClient(app)
    non_admin.post("/auth/test/login?email=alguien@phicus.es")
    r2 = non_admin.get("/api/results.csv")
    assert r2.status_code == 403


def test_results_sorted_with_tiebreaker(admin_client):
    from kratos.db import connection
    from kratos.models import ballot

    high_id = _create(admin_client, "Zeta high")
    mid1_id = _create(admin_client, "Beta tie")
    mid2_id = _create(admin_client, "alfa tie")  # mismo total que mid1, gana alfa
    low_id = _create(admin_client, "Yota low")

    admin_client.post("/api/admin/period/open")
    with connection() as conn:
        ballot.submit(
            conn,
            user_email="u1@phicus.es",
            scores={high_id: 10, mid1_id: 7, mid2_id: 7, low_id: 1},
        )
        ballot.submit(
            conn,
            user_email="u2@phicus.es",
            scores={high_id: 10, mid1_id: 7, mid2_id: 7, low_id: 1},
        )
    admin_client.post("/api/admin/period/close")

    data = admin_client.get("/api/results").json()
    names = [e["name"] for e in data["entries"]]
    assert names == ["Zeta high", "alfa tie", "Beta tie", "Yota low"]
    high = next(e for e in data["entries"] if e["proposal_id"] == high_id)
    assert high["total_score"] == 20
    assert high["vote_count"] == 2


def test_results_csv_admin_only(admin_client, app):
    a = _create(admin_client, "Sola")
    admin_client.post("/api/admin/period/open")
    admin_client.post("/api/admin/period/close")
    # Admin OK
    r = admin_client.get("/api/results.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    body = r.text
    assert "proposal_id,name,total_score,vote_count" in body
    assert "Sola" in body
    # Usuario normal con cliente independiente: 403
    from fastapi.testclient import TestClient

    non_admin = TestClient(app)
    non_admin.post("/auth/test/login?email=normalito@phicus.es")
    r2 = non_admin.get("/api/results.csv")
    assert r2.status_code == 403
    del a
