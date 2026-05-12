"""US4 — bulk-exclude / bulk-restore endpoints."""

from __future__ import annotations


def _create(client, name: str) -> int:
    r = client.post("/api/admin/proposals", json={"name": name, "description": "d"})
    assert r.status_code == 201
    return r.json()["id"]


def test_bulk_exclude_three_votables(admin_client):
    ids = [_create(admin_client, f"P{i}") for i in range(3)]
    r = admin_client.post(
        "/api/admin/proposals/bulk-exclude", json={"proposal_ids": ids}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["affected"] == 3
    assert body["skipped"] == []
    assert len(body["bulk_group_id"]) == 8

    # Las 3 quedan excluded
    listing = admin_client.get("/api/proposals").json()
    by_id = {p["id"]: p for p in listing}
    for pid in ids:
        assert by_id[pid]["status"] == "excluded"

    # 3 entradas de audit PROPOSAL_EXCLUDE con el mismo bulk_group_id
    audit = admin_client.get("/api/admin/audit-log?limit=50").json()
    exclude_entries = [
        e
        for e in audit
        if e["action"] == "PROPOSAL_EXCLUDE"
        and e.get("details", {}).get("bulk_group_id") == body["bulk_group_id"]
    ]
    assert len(exclude_entries) == 3


def test_bulk_exclude_mixed_with_already_excluded(admin_client):
    ids = [_create(admin_client, f"M{i}") for i in range(3)]
    # Pre-excluir el primero individualmente
    assert admin_client.post(f"/api/admin/proposals/{ids[0]}/exclude").status_code == 204

    r = admin_client.post(
        "/api/admin/proposals/bulk-exclude", json={"proposal_ids": ids}
    )
    body = r.json()
    assert body["affected"] == 2
    assert len(body["skipped"]) == 1
    assert body["skipped"][0]["proposal_id"] == ids[0]
    assert body["skipped"][0]["reason"] == "not_votable"


def test_bulk_restore_inverse(admin_client):
    ids = [_create(admin_client, f"R{i}") for i in range(3)]
    admin_client.post("/api/admin/proposals/bulk-exclude", json={"proposal_ids": ids})
    r = admin_client.post(
        "/api/admin/proposals/bulk-restore", json={"proposal_ids": ids}
    )
    body = r.json()
    assert body["affected"] == 3
    assert body["skipped"] == []
    # Vuelven a votable
    listing = admin_client.get("/api/proposals").json()
    by_id = {p["id"]: p for p in listing}
    for pid in ids:
        assert by_id[pid]["status"] == "votable"


def test_bulk_rejects_unknown_ids(admin_client):
    pid = _create(admin_client, "Solo")
    r = admin_client.post(
        "/api/admin/proposals/bulk-exclude",
        json={"proposal_ids": [pid, 99999]},
    )
    body = r.json()
    assert body["affected"] == 1
    assert any(s["reason"] == "not_found" for s in body["skipped"])


def test_bulk_blocked_outside_preparacion(admin_client):
    pid = _create(admin_client, "Solo")
    admin_client.post("/api/admin/period/open")
    r = admin_client.post(
        "/api/admin/proposals/bulk-exclude", json={"proposal_ids": [pid]}
    )
    assert r.status_code == 409


def test_bulk_empty_list_422(admin_client):
    r = admin_client.post(
        "/api/admin/proposals/bulk-exclude", json={"proposal_ids": []}
    )
    assert r.status_code == 422
