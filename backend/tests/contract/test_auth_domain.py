"""**Principio III (Auth dominio @phicus.es) — TEST INNEGOCIABLE**.

Valida que `validate_phicus_identity()` rechaza correctamente identidades
fuera del dominio. Comprobamos:
  (a) `hd != "phicus.es"` → rechazo.
  (b) `hd == "phicus.es"` pero email con otro sufijo → rechazo.
  (c) `email_verified is False` → rechazo.
  (d) identidad válida → acepta y devuelve email normalizado.

También testea el endpoint de test login para asegurar que rechaza
cuentas no-Phicus aunque ese endpoint sólo exista en modo test (defensa
en profundidad).
"""

from __future__ import annotations

from kratos.auth.google import validate_phicus_identity


def test_rejects_when_hd_is_other_domain():
    claims = {"hd": "otra.com", "email": "user@phicus.es", "email_verified": True}
    ok, reason = validate_phicus_identity(claims)
    assert ok is False
    assert "invalid_hd" in reason


def test_rejects_when_email_suffix_is_not_phicus():
    claims = {"hd": "phicus.es", "email": "user@otra.com", "email_verified": True}
    ok, reason = validate_phicus_identity(claims)
    assert ok is False
    assert "invalid_email_suffix" in reason


def test_rejects_when_email_not_verified():
    claims = {"hd": "phicus.es", "email": "user@phicus.es", "email_verified": False}
    ok, reason = validate_phicus_identity(claims)
    assert ok is False
    assert reason == "email_not_verified"


def test_rejects_when_hd_missing():
    claims = {"email": "user@phicus.es", "email_verified": True}
    ok, reason = validate_phicus_identity(claims)
    assert ok is False
    assert "invalid_hd" in reason


def test_accepts_valid_phicus_identity_and_normalizes_email():
    claims = {"hd": "phicus.es", "email": "User@PHICUS.es", "email_verified": True}
    ok, value = validate_phicus_identity(claims)
    assert ok is True
    assert value == "user@phicus.es"


def test_test_login_endpoint_only_in_test_env_and_only_phicus(client):
    # Es modo test (conftest fija ENV=test), así que el endpoint existe.
    resp_external = client.post("/auth/test/login?email=foo@gmail.com")
    assert resp_external.status_code == 403

    resp_ok = client.post("/auth/test/login?email=alguien@phicus.es")
    assert resp_ok.status_code == 204
    # La cookie debe estar set
    assert any(c.name == "phicus_session" for c in client.cookies.jar)


def test_test_login_rejects_when_not_test_env(monkeypatch, client):
    # Cambiamos ENV a producción y vaciamos cache; el endpoint debe responder 404.
    monkeypatch.setenv("ENV", "production")
    monkeypatch.setenv("SESSION_SECRET", "x" * 32)  # válido para producción
    from kratos import config

    config.get_settings.cache_clear()
    resp = client.post("/auth/test/login?email=alguien@phicus.es")
    assert resp.status_code == 404
