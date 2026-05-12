"""Fixtures compartidas: settings overrideadas, DB temporal, TestClient."""

from __future__ import annotations

import os
from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def _isolate_settings(tmp_path, monkeypatch):
    """Cada test recibe una DB y un secreto frescos. Apunta a tmp_path."""
    db_path = tmp_path / "voting.db"
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("DB_PATH", str(db_path))
    monkeypatch.setenv("SESSION_SECRET", "test-secret-" + os.urandom(8).hex())
    monkeypatch.setenv("ADMIN_EMAILS", "jgomez@phicus.es,epastor@phicus.es")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("BASE_URL", "http://testserver")

    # Reset settings cache
    from kratos import config

    config.get_settings.cache_clear()
    # Reset OAuth singleton (sino conserva client_id de un test previo)
    from kratos.auth import google as google_mod

    google_mod._oauth = None  # type: ignore[attr-defined]

    yield

    config.get_settings.cache_clear()
    google_mod._oauth = None  # type: ignore[attr-defined]


@pytest.fixture
def init_db(_isolate_settings):  # noqa: ARG001 — depende del autouse para tener env listo
    from kratos.db import init_db as _init

    _init()


@pytest.fixture
def app(init_db):  # noqa: ARG001
    from kratos.main import create_app

    return create_app()


@pytest.fixture
def client(app):
    from fastapi.testclient import TestClient

    return TestClient(app)


@pytest.fixture
def authed_client(client, monkeypatch):
    """Cliente con sesión de usuario normal (no admin) ya iniciada."""
    email = "alguien@phicus.es"
    resp = client.post(f"/auth/test/login?email={email}")
    assert resp.status_code == 204, resp.text
    return client


@pytest.fixture
def admin_client(client):
    email = "jgomez@phicus.es"
    resp = client.post(f"/auth/test/login?email={email}")
    assert resp.status_code == 204, resp.text
    return client


@pytest.fixture
def seed_proposals():
    """Función que recibe `conn` y siembra N propuestas votables."""

    def _seed(conn, names: list[str] | None = None) -> list[int]:
        names = names or ["Refactor login", "Centralizar API", "Onboarding"]
        ids: list[int] = []
        for n in names:
            cur = conn.execute(
                "INSERT INTO proposals(name, description, status) VALUES (?, ?, 'votable')",
                (n, f"Descripción de {n}"),
            )
            ids.append(int(cur.lastrowid))
        return ids

    return _seed


@pytest.fixture
def open_period():
    def _open(conn) -> None:
        conn.execute("UPDATE periods SET state='abierto', opened_at=datetime('now') WHERE id=1")

    return _open


@pytest.fixture
def close_period():
    def _close(conn) -> None:
        conn.execute("UPDATE periods SET state='cerrado', closed_at=datetime('now') WHERE id=1")

    return _close


# Helper para que los tests puedan localizar el CSV original.
@pytest.fixture
def seed_csv_path() -> Path:
    return Path(__file__).resolve().parents[2] / "backend" / "data" / "seed" / "proposals.csv"
