"""Importación CSV idempotente desde el formulario de Google (US3)."""

from __future__ import annotations

import io

CSV_HEADER = (
    "Marca temporal,"
    "Dirección de correo electrónico,"
    "¿Cuál sería el nombre de la idea/proyecto?,"
    "Describe cual es el objetivo de la idea/proyecto. ¿Qué soluciona o facilita?,"
    "¿Sabrías explicar como lo harías? (OPCIONAL),"
    '"¿Podrías estimar si se podría hacer en un día o se necesitarían varios? (OPCIONAL, sólo si sabes cómo se haría)",'
    "VOTOS\n"
)

SAMPLE_ROWS = [
    "11/05/2026 10:39:48,asanchez@phicus.es,FeedBack_clientes,Opinión clientes,Formulario,5,",
    "11/05/2026 11:09:04,rpardines@phicus.es,Toolops,Automatizar tiempos,Modulos pequeños,5,",
    "11/05/2026 11:16:49,amarco@phicus.es,CPE Assist,Asistente CPE,Bot guía,,",
    "11/05/2026 11:30:00,foo@otra.com,Spam,No es phicus,,,",  # rechazada por dominio
    "11/05/2026 11:40:00,,SinAutor,Descripción sin autor,,1,",  # aceptada (autor opcional)
]


def _csv(rows):
    return CSV_HEADER + "\n".join(rows) + "\n"


def test_import_via_endpoint_is_idempotent(admin_client):
    csv_text = _csv(SAMPLE_ROWS)
    files = {"file": ("proposals.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    r = admin_client.post("/api/admin/proposals/import", files=files)
    assert r.status_code == 200, r.text
    result = r.json()
    # 4 válidas, 1 rechazada por dominio
    assert result["imported"] == 4
    assert result["skipped"] == 1

    # Re-import → 0 imported, 5 skipped (4 ya existen + 1 sigue siendo external)
    files = {"file": ("proposals.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    r = admin_client.post("/api/admin/proposals/import", files=files)
    assert r.json() == {"imported": 0, "skipped": 5}


def test_import_blocked_outside_preparacion(admin_client):
    admin_client.post("/api/admin/period/open")
    files = {"file": ("p.csv", io.BytesIO(_csv(SAMPLE_ROWS).encode("utf-8")), "text/csv")}
    r = admin_client.post("/api/admin/proposals/import", files=files)
    assert r.status_code == 409


def test_real_seed_csv_imports_successfully(admin_client, seed_csv_path):
    if not seed_csv_path.exists():
        import pytest

        pytest.skip(f"Seed CSV no encontrado en {seed_csv_path}")
    with seed_csv_path.open("rb") as f:
        files = {"file": ("seed.csv", f, "text/csv")}
        r = admin_client.post("/api/admin/proposals/import", files=files)
    assert r.status_code == 200, r.text
    data = r.json()
    # El CSV real tiene ~174 filas. Esperamos al menos 10 importadas.
    assert data["imported"] >= 10, data
