"""**Principio I (Anonimato) — TEST INNEGOCIABLE**.

Garantiza que `/api/admin/participation` NUNCA correlaciona votantes
con puntuaciones. Tres invariantes (research.md §9):

1. **JSON response**: ninguna clave del payload (recursivamente) se
   llama `score`/`scores`/`ballot_uuid`/`proposal_id`/`ballot`.
2. **AST**: el módulo `api/admin_participation.py` no importa
   `vote_scores`, `results`, `ballot` ni el módulo `models.results`.
3. **Query trace**: bajo un wrapper de conexión SQLite que captura
   todos los `execute()`/`executescript()`, la llamada al endpoint no
   produce ninguna SQL que mencione `vote_scores`.
"""

from __future__ import annotations

import ast
import re
import sqlite3
from pathlib import Path


def _seed_open_with_votes(admin_client):
    """Crea propuesta, abre periodo y emite 5 papeletas con scores variados."""
    from kratos.db import connection
    from kratos.models import ballot

    pid = admin_client.post(
        "/api/admin/proposals", json={"name": "P", "description": "d"}
    ).json()["id"]
    admin_client.post("/api/admin/period/open")
    with connection() as conn:
        for i in range(5):
            ballot.submit(
                conn, user_email=f"user{i}@phicus.es", scores={pid: (i % 10) + 1}
            )
    return pid


# ─── Invariante 1: payload JSON no contiene claves de scores ───────────────

FORBIDDEN_KEYS = re.compile(r"score|ballot_uuid|ballot$|proposal_id", re.IGNORECASE)


def _walk_keys(node):
    if isinstance(node, dict):
        for k, v in node.items():
            yield k
            yield from _walk_keys(v)
    elif isinstance(node, list):
        for item in node:
            yield from _walk_keys(item)


def test_response_payload_has_no_score_keys(admin_client):
    _seed_open_with_votes(admin_client)
    data = admin_client.get("/api/admin/participation").json()
    leaked = [k for k in _walk_keys(data) if FORBIDDEN_KEYS.search(k)]
    assert leaked == [], (
        f"El response de /api/admin/participation contiene claves prohibidas: {leaked}"
    )


# ─── Invariante 2: AST estático del módulo del endpoint ─────────────────────

FORBIDDEN_IMPORTS = {"vote_scores", "results", "ballot"}


def test_admin_participation_module_has_no_forbidden_imports():
    src = (
        Path(__file__).resolve().parents[2]
        / "src"
        / "kratos"
        / "api"
        / "admin_participation.py"
    ).read_text(encoding="utf-8")
    tree = ast.parse(src)
    offenders: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            # mod típico: "..models" → revisar nombres importados
            for name in node.names:
                if name.name in FORBIDDEN_IMPORTS:
                    offenders.append(f"from {mod} import {name.name}")
        elif isinstance(node, ast.Import):
            for name in node.names:
                if any(part in FORBIDDEN_IMPORTS for part in name.name.split(".")):
                    offenders.append(f"import {name.name}")
    assert offenders == [], (
        f"admin_participation.py importa módulos prohibidos por Principio I: {offenders}"
    )


# ─── Invariante 3: trace de SQL durante la llamada al endpoint ──────────────


class _TracingConnectionProxy:
    """Envuelve una conexión SQLite y captura todas las SQL ejecutadas."""

    def __init__(self, real: sqlite3.Connection, log: list[str]) -> None:
        self._real = real
        self._log = log

    def execute(self, sql: str, *args, **kwargs):
        self._log.append(sql)
        return self._real.execute(sql, *args, **kwargs)

    def executemany(self, sql: str, *args, **kwargs):
        self._log.append(sql)
        return self._real.executemany(sql, *args, **kwargs)

    def executescript(self, sql: str, *args, **kwargs):
        self._log.append(sql)
        return self._real.executescript(sql, *args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._real, name)


def test_endpoint_does_not_query_vote_scores(admin_client, monkeypatch):
    _seed_open_with_votes(admin_client)

    captured: list[str] = []
    from kratos import db as db_mod

    original_connection = db_mod.connection

    from contextlib import contextmanager

    @contextmanager
    def tracing_connection():
        with original_connection() as real:
            yield _TracingConnectionProxy(real, captured)

    # El módulo admin_participation hace `from ..db import connection, transaction`,
    # así que parchear sólo en `kratos.db` no basta; parcheamos en su namespace.
    from kratos.api import admin_participation

    monkeypatch.setattr(admin_participation, "connection", tracing_connection)

    r = admin_client.get("/api/admin/participation")
    assert r.status_code == 200

    offenders = [sql for sql in captured if "vote_scores" in sql.lower()]
    assert offenders == [], (
        f"/api/admin/participation ejecutó SQL contra vote_scores: {offenders}"
    )
    # Sanity: alguna query sobre vote_receipts SÍ debe aparecer.
    assert any("vote_receipts" in sql.lower() for sql in captured), (
        "El test no ha capturado ninguna query — el monkeypatch no funcionó."
    )
