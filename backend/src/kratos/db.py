"""Conexión SQLite y runner de migraciones.

Modo WAL + foreign_keys=ON + `BEGIN IMMEDIATE` para emisión de voto.
Por simplicidad (Principio IV) usamos `sqlite3` stdlib, no un ORM.
"""

from __future__ import annotations

import sqlite3
import sys
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import get_settings

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"


def _connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(
        str(db_path),
        detect_types=sqlite3.PARSE_DECLTYPES,
        isolation_level=None,  # autocommit; usamos BEGIN explícito
        check_same_thread=False,
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn


def get_connection() -> sqlite3.Connection:
    """Devuelve una conexión fresca. El consumidor es responsable de cerrarla."""
    return _connect(get_settings().db_path_absolute)


@contextmanager
def connection() -> Iterator[sqlite3.Connection]:
    """Context manager que cierra la conexión al salir."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def transaction(conn: sqlite3.Connection, *, immediate: bool = True) -> Iterator[sqlite3.Connection]:
    """Transacción explícita. `immediate=True` adquiere lock RESERVED inmediato.

    Necesario en `POST /api/ballot` para serializar dobles votos del mismo
    usuario (Principio II).
    """
    conn.execute("BEGIN IMMEDIATE" if immediate else "BEGIN")
    try:
        yield conn
        conn.execute("COMMIT")
    except BaseException:
        conn.execute("ROLLBACK")
        raise


def init_db() -> None:
    """Aplica migraciones idempotentemente. Llamable con `python -m kratos.db init`."""
    with connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        applied = {row["version"] for row in conn.execute("SELECT version FROM schema_migrations")}
        for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
            version = sql_file.stem
            if version in applied:
                continue
            sql = sql_file.read_text(encoding="utf-8")
            conn.executescript(sql)
            conn.execute("INSERT INTO schema_migrations(version) VALUES (?)", (version,))
            print(f"[db] applied migration {version}", file=sys.stderr)


def main() -> None:
    if len(sys.argv) >= 2 and sys.argv[1] == "init":
        init_db()
        print("[db] OK")
        return
    print("Usage: python -m kratos.db init", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
