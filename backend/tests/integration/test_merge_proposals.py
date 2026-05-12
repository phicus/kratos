"""US3 — Fusión y deshacer fusión de propuestas, con persistencia de padres."""

from __future__ import annotations


def _create(client, name: str, description: str = "desc") -> int:
    r = client.post("/api/admin/proposals", json={"name": name, "description": description})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_merge_and_unmerge_full_flow(admin_client):
    a = _create(admin_client, "Propuesta A")
    b = _create(admin_client, "Propuesta B")
    c = _create(admin_client, "Propuesta C")  # esta NO se fusiona

    r = admin_client.post(
        "/api/admin/proposals/merge",
        json={
            "parent_ids": [a, b],
            "name": "A+B fusionadas",
            "description": "Ambas ideas combinadas",
        },
    )
    assert r.status_code == 201, r.text
    child = r.json()
    child_id = child["id"]
    assert sorted(child["parent_ids"]) == sorted([a, b])
    assert child["status"] == "votable"

    # Verificación: votantes no ven A ni B; ven C y el hijo
    voter_view = admin_client.get("/api/proposals").json()
    # En preparacion+admin, ve todas. Forzamos el view de votante abriendo periodo.
    admin_client.post("/api/admin/period/open")
    voter_view = admin_client.get("/api/proposals").json()
    visible_ids = {p["id"] for p in voter_view}
    assert a not in visible_ids
    assert b not in visible_ids
    assert c in visible_ids
    assert child_id in visible_ids

    # Volver a preparacion para deshacer
    admin_client.post("/api/admin/period/close")
    admin_client.post("/api/admin/period/reset")

    r = admin_client.post(f"/api/admin/proposals/{child_id}/unmerge")
    assert r.status_code == 204
    # A y B vuelven a votable, hijo borrado
    listing = admin_client.get("/api/proposals").json()
    by_id = {p["id"]: p for p in listing}
    assert by_id[a]["status"] == "votable"
    assert by_id[b]["status"] == "votable"
    assert child_id not in by_id


def test_merge_blocked_when_period_not_in_preparacion(admin_client):
    a = _create(admin_client, "A1")
    b = _create(admin_client, "B1")
    admin_client.post("/api/admin/period/open")
    r = admin_client.post(
        "/api/admin/proposals/merge",
        json={"parent_ids": [a, b], "name": "X", "description": "Y"},
    )
    assert r.status_code == 409


def test_merge_requires_at_least_two_parents(admin_client):
    a = _create(admin_client, "Solo")
    r = admin_client.post(
        "/api/admin/proposals/merge",
        json={"parent_ids": [a], "name": "X", "description": "Y"},
    )
    assert r.status_code == 422
