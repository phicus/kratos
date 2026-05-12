# syntax=docker/dockerfile:1.7

# ─── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: backend runtime ─────────────────────────────────────────────────
FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ENV=production

WORKDIR /app

# Source + built frontend. The backend package uses a src/ layout, so the
# package sources must be present before `pip install ./backend`.
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist /app/backend/src/kratos/static

RUN pip install --upgrade pip && pip install ./backend

# Data dir (mounted volume in production)
RUN mkdir -p /app/backend/data

EXPOSE 8000
WORKDIR /app/backend
CMD ["uvicorn", "kratos.main:app", "--host", "0.0.0.0", "--port", "8000"]
