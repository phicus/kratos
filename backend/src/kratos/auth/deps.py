"""FastAPI dependencies para auth y autorización."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from .session import SessionUser, read_session


def get_current_user(request: Request) -> SessionUser | None:
    return read_session(request)


def require_user(user: SessionUser | None = Depends(get_current_user)) -> SessionUser:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    return user


def require_admin(user: SessionUser = Depends(require_user)) -> SessionUser:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acción reservada a administradores",
        )
    return user
