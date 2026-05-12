"""Endpoints de autenticación: flow OIDC con Google + logout."""

from __future__ import annotations

from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse, Response

from ..auth.google import OAuthError, get_oauth, validate_phicus_identity
from ..auth.session import clear_session, issue_session
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _callback_url() -> str:
    """Construye `redirect_uri` desde BASE_URL.

    En dev, BASE_URL apunta al frontend (p.ej. http://localhost:5173) para que
    Google redirija al usuario al origen donde corre la SPA; Vite proxea el
    callback al backend y la cookie de sesión se fija en el origen correcto.
    En producción, BASE_URL es el dominio público (https://kratos.phicus.es)
    donde backend y SPA comparten origen.
    """
    base = get_settings().base_url.rstrip("/")
    return f"{base}/auth/google/callback"


@router.get("/google/login")
async def google_login(request: Request):
    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail=(
                "Google OAuth no está configurado: define GOOGLE_CLIENT_ID y "
                "GOOGLE_CLIENT_SECRET en .env (en dev usa el endpoint "
                "/auth/test/login para sesión sin OAuth)."
            ),
        )
    oauth = get_oauth()
    return await oauth.google.authorize_redirect(request, _callback_url())


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request):
    oauth = get_oauth()
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"OAuth error: {exc.error}",
        ) from exc

    claims = token.get("userinfo")
    if claims is None:
        # Algunos flujos sólo devuelven id_token; parsearlo.
        claims = await oauth.google.parse_id_token(request, token)

    ok, value = validate_phicus_identity(dict(claims))
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Identidad rechazada (sólo cuentas @phicus.es): {value}",
        )

    # Redirige al origen donde corre la SPA (BASE_URL), no al backend.
    redirect = RedirectResponse(url=get_settings().base_url.rstrip("/") + "/", status_code=302)
    issue_session(redirect, email=value)
    return redirect


@router.post("/logout", status_code=204)
async def logout():
    response = Response(status_code=204)
    clear_session(response)
    return response


@router.post("/test/login", include_in_schema=False)
async def test_login(email: str):
    """Endpoint sólo para `ENV=test`/`development`: crea una sesión sin pasar por Google.

    Necesario para los tests E2E del frontend y para los tests de integración
    que validan el flujo de voto sin tener que mockear Google a nivel de red.
    """
    settings = get_settings()
    if settings.env.lower() not in {"test", "development"}:
        raise HTTPException(status_code=404, detail="Not Found")
    if not email.lower().endswith("@phicus.es"):
        raise HTTPException(
            status_code=403,
            detail="test/login sólo acepta cuentas @phicus.es (Principio III).",
        )
    response = Response(status_code=204)
    issue_session(response, email=email)
    return response


def _google_authorize_url_for_tests(client_id: str, redirect_uri: str, state: str) -> str:
    """Helper para fixtures de test que necesiten construir un URL similar al real."""
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
