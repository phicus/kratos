"""Cliente OIDC Google con Authlib.

Flujo:
1. `/auth/google/login` → redirige al authorize URL de Google.
2. Google → `/auth/google/callback` con `code`.
3. Authlib intercambia code por id_token, verifica firma JWK + claims básicos.
4. Validación ADICIONAL server-side (Principio III): `hd == "phicus.es"` AND
   `email.endswith("@phicus.es")` AND `email_verified is True`.
"""

from __future__ import annotations

from authlib.integrations.starlette_client import OAuth, OAuthError

from ..config import get_settings

_oauth: OAuth | None = None

GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
PHICUS_DOMAIN = "phicus.es"


def get_oauth() -> OAuth:
    global _oauth
    if _oauth is not None:
        return _oauth
    settings = get_settings()
    oauth = OAuth()
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url=GOOGLE_DISCOVERY_URL,
        client_kwargs={"scope": "openid email profile"},
    )
    _oauth = oauth
    return oauth


def validate_phicus_identity(claims: dict) -> tuple[bool, str]:
    """Doble check Principio III. Devuelve (ok, email_o_motivo_error)."""
    if not claims:
        return False, "no_claims"
    if not claims.get("email_verified", False):
        return False, "email_not_verified"
    hd = claims.get("hd")
    if hd != PHICUS_DOMAIN:
        return False, f"invalid_hd:{hd!r}"
    email_raw = claims.get("email", "")
    email = email_raw.lower().strip() if isinstance(email_raw, str) else ""
    if not email.endswith("@" + PHICUS_DOMAIN):
        return False, f"invalid_email_suffix:{email!r}"
    return True, email


__all__ = ["PHICUS_DOMAIN", "OAuthError", "get_oauth", "validate_phicus_identity"]
