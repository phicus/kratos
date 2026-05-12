"""Script CLI para importar el CSV semilla desde el formulario de Google.

Uso:
    python -m kratos.seed.import_csv backend/data/seed/proposals.csv [--admin EMAIL]

Idempotente: re-ejecutar no crea duplicados. Sólo permitido con el periodo
en estado `preparacion`.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from ..config import get_settings
from ..db import connection, init_db, transaction
from ..models import period as period_mod
from ..models import proposal


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Importar propuestas desde un CSV de Google Forms."
    )
    parser.add_argument("csv_path", type=Path)
    parser.add_argument(
        "--admin",
        default=None,
        help="Email de admin para el log de auditoría (default: primero de ADMIN_EMAILS).",
    )
    args = parser.parse_args(argv)

    if not args.csv_path.exists():
        print(f"[seed] ERROR: no existe {args.csv_path}", file=sys.stderr)
        return 1

    settings = get_settings()
    admin_email = args.admin or next(iter(settings.admin_email_set), None)
    if not admin_email:
        print("[seed] ERROR: no se pudo determinar un admin (ADMIN_EMAILS vacío)", file=sys.stderr)
        return 1

    init_db()

    csv_text = args.csv_path.read_text(encoding="utf-8-sig")

    with connection() as conn, transaction(conn):
        state = period_mod.get_state(conn)
        if state != "preparacion":
            print(
                f"[seed] ERROR: el periodo está '{state}'; sólo se puede importar en 'preparacion'.",
                file=sys.stderr,
            )
            return 2
        imported, skipped = proposal.import_csv_text(conn, csv_text, admin_email=admin_email)
    print(f"[seed] OK · imported={imported} · skipped={skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
