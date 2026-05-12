"""App FastAPI principal — Kratos.

Monta:
- Middlewares: GZip, SessionMiddleware (necesario para el flow OAuth de Authlib).
- Routers: /auth, /api/me, /api/period, /api/proposals, /api/ballot, /api/results, /api/admin/*.
- Estáticos: si existe `static/`, sirve la SPA con fallback a `index.html`
  para rutas de React Router que no son `/api/*` ni `/auth/*`.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .config import get_settings

STATIC_DIR = Path(__file__).resolve().parent / "static"


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Kratos",
        version="0.1.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )

    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret,
        session_cookie="phicus_oauth_state",
        same_site="lax",
        https_only=settings.is_production,
        max_age=600,  # sólo para el state de OAuth, corto
    )

    # Routers
    from .api import (
        admin_audit,
        admin_dashboard,
        admin_participation,
        admin_period,
        admin_proposals,
        auth,
        ballot,
        me,
        period,
        proposals,
        results,
    )

    app.include_router(auth.router)
    app.include_router(me.router)
    app.include_router(period.router)
    app.include_router(proposals.router)
    app.include_router(ballot.router)
    app.include_router(results.router)
    app.include_router(admin_period.router)
    app.include_router(admin_proposals.router)
    app.include_router(admin_audit.router)
    app.include_router(admin_dashboard.router)
    app.include_router(admin_participation.router)

    # Estáticos: sólo si existe el bundle del frontend.
    if STATIC_DIR.exists():
        app.mount(
            "/assets",
            StaticFiles(directory=STATIC_DIR / "assets", check_dir=False),
            name="assets",
        )

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa_fallback(full_path: str, request: Request):
            if full_path.startswith(("api/", "auth/")):
                return JSONResponse({"detail": "Not Found"}, status_code=404)
            file_path = STATIC_DIR / full_path
            if file_path.is_file():
                return FileResponse(file_path)
            index = STATIC_DIR / "index.html"
            if index.is_file():
                return FileResponse(index)
            return JSONResponse({"detail": "Not Found"}, status_code=404)

    return app


app = create_app()
