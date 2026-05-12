"""Carga tipada de configuración desde variables de entorno.

Lee `.env` si existe (sólo en desarrollo). En producción se confía en el
entorno del proceso (Docker, systemd).
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: str = "development"

    google_client_id: str = ""
    google_client_secret: str = ""

    session_secret: str = "dev-secret-change-me-in-production"
    session_max_age_seconds: int = 8 * 60 * 60  # 8h

    admin_emails: str = "jgomez@phicus.es,epastor@phicus.es"

    db_path: str = "./data/voting.db"
    # Origen donde el navegador ve la app. En dev = URL del frontend (Vite);
    # en producción = dominio público donde backend y SPA comparten origen.
    base_url: str = "http://localhost:5173"

    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

    @property
    def db_path_absolute(self) -> Path:
        p = Path(self.db_path)
        if not p.is_absolute():
            p = Path.cwd() / p
        return p


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    load_dotenv()
    return Settings()
