"""Cookie de sesión firmada con itsdangerous.

Cookie HTTP-only firmada simétricamente con `SESSION_SECRET`. Payload mínimo:
`{email, is_admin, issued_at}`. TTL controlado por
`Settings.session_max_age_seconds`. Verificación local sin DB.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from fastapi import Request, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from ..config import Settings, get_settings

COOKIE_NAME = "phicus_session"


@dataclass(frozen=True, slots=True)
class SessionUser:
    email: str
    is_admin: bool
    issued_at: int


def _serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.session_secret, salt="phicus.session.v1")


def issue_session(response: Response, *, email: str) -> SessionUser:
    """Firma una nueva cookie de sesión y la fija en la respuesta."""
    settings = get_settings()
    is_admin = email.lower() in settings.admin_email_set
    issued_at = int(time.time())
    payload = {"email": email.lower(), "is_admin": is_admin, "issued_at": issued_at}
    token = _serializer(settings).dumps(payload)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        path="/",
    )
    return SessionUser(email=email.lower(), is_admin=is_admin, issued_at=issued_at)


def clear_session(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def read_session(request: Request) -> SessionUser | None:
    """Devuelve el usuario de sesión o None si no hay cookie / es inválida / expiró."""
    settings = get_settings()
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        payload = _serializer(settings).loads(
            token, max_age=settings.session_max_age_seconds
        )
    except (BadSignature, SignatureExpired):
        return None
    if not isinstance(payload, dict):
        return None
    email = payload.get("email")
    if not isinstance(email, str):
        return None
    return SessionUser(
        email=email.lower(),
        is_admin=email.lower() in settings.admin_email_set,
        issued_at=int(payload.get("issued_at", 0)),
    )
