## Kratos — Makefile
##
## Comandos rápidos para desarrollo. Ejecuta `make help` para la lista completa.

# Rutas
BACKEND_DIR  := backend
FRONTEND_DIR := frontend
VENV         := $(BACKEND_DIR)/.venv
PY           := $(VENV)/bin/python
PIP          := $(VENV)/bin/pip
UVICORN      := $(VENV)/bin/uvicorn
PYTEST       := $(VENV)/bin/pytest
SEED_CSV     := $(BACKEND_DIR)/data/seed/proposals.csv

# Puertos
BACKEND_PORT  ?= 8000
FRONTEND_PORT ?= 5173

# Comando npm (cambia a pnpm o yarn si lo prefieres)
NPM ?= npm

.PHONY: help dev install install-backend install-frontend init seed \
        backend frontend backend-bg frontend-bg \
        test test-backend test-frontend \
        build build-frontend lint typecheck \
        docker-build docker-up docker-down \
        clean clean-db distclean stop

# ─────────────────────────────────────────────────────────────────────────────
help: ## Lista los targets disponibles
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ─── DEV (target principal) ──────────────────────────────────────────────────

dev: install init ## Arranca backend y frontend juntos (Ctrl-C para parar ambos)
	@echo "→ Backend en :$(BACKEND_PORT) · Frontend en :$(FRONTEND_PORT)"
	@echo "→ Ctrl-C para detener ambos"
	@trap 'kill 0' INT TERM EXIT; \
		( cd $(BACKEND_DIR) && \
		  $(CURDIR)/$(UVICORN) kratos.main:app --reload --port $(BACKEND_PORT) ) & \
		( cd $(FRONTEND_DIR) && $(NPM) run dev -- --port $(FRONTEND_PORT) ) & \
		wait

# ─── Setup ───────────────────────────────────────────────────────────────────

install: install-backend install-frontend ## Instala dependencias backend + frontend

install-backend: $(VENV)/pyvenv.cfg ## Crea venv e instala el backend
	@echo "→ Instalando backend"
	@$(PIP) install --quiet --upgrade pip
	@$(PIP) install --quiet -e "$(BACKEND_DIR)[dev]"

$(VENV)/pyvenv.cfg:
	@echo "→ Creando venv en $(VENV)"
	@python3 -m venv $(VENV)

install-frontend: $(FRONTEND_DIR)/node_modules ## Instala deps del frontend

$(FRONTEND_DIR)/node_modules: $(FRONTEND_DIR)/package.json
	@echo "→ Instalando frontend"
	@cd $(FRONTEND_DIR) && $(NPM) install --no-audit --no-fund

# ─── Base de datos ───────────────────────────────────────────────────────────

init: install-backend ## Crea la DB + aplica migraciones + siembra propuestas (idempotente)
	@cd $(BACKEND_DIR) && $(CURDIR)/$(PY) -m kratos.db init
	@if [ -f $(SEED_CSV) ]; then \
		cd $(BACKEND_DIR) && $(CURDIR)/$(PY) -m kratos.seed.import_csv data/seed/proposals.csv \
			|| echo "→ seed saltado (periodo ya no está en 'preparacion'; usa 'make clean-db && make init' para resetear)"; \
	else \
		echo "→ Sin CSV semilla en $(SEED_CSV); saltando seed"; \
	fi

seed: install-backend ## Re-importa el CSV semilla (idempotente; sólo en estado 'preparacion')
	@cd $(BACKEND_DIR) && $(CURDIR)/$(PY) -m kratos.seed.import_csv data/seed/proposals.csv

# ─── Servidores individuales ─────────────────────────────────────────────────

backend: install-backend ## Arranca solo el backend (foreground)
	@cd $(BACKEND_DIR) && $(CURDIR)/$(UVICORN) kratos.main:app --reload --port $(BACKEND_PORT)

frontend: install-frontend ## Arranca solo el frontend (foreground)
	@cd $(FRONTEND_DIR) && $(NPM) run dev -- --port $(FRONTEND_PORT)

# ─── Tests ───────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Ejecuta todos los tests

test-backend: install-backend ## Tests backend (pytest)
	@cd $(BACKEND_DIR) && $(CURDIR)/$(PYTEST) -q

test-mandatory: install-backend ## Sólo los 3 tests innegociables (Principios I/II/III)
	@cd $(BACKEND_DIR) && $(CURDIR)/$(PYTEST) -v \
		tests/integration/test_vote_anonymity.py \
		tests/integration/test_vote_unicity.py \
		tests/contract/test_auth_domain.py

test-frontend: install-frontend ## Tests frontend (vitest)
	@cd $(FRONTEND_DIR) && $(NPM) run test

test-e2e: install-frontend ## Tests E2E Playwright (requiere backend corriendo en ENV=test)
	@cd $(FRONTEND_DIR) && $(NPM) run test:e2e

# ─── Calidad ─────────────────────────────────────────────────────────────────

typecheck: install-frontend ## TypeScript --noEmit
	@cd $(FRONTEND_DIR) && npx tsc --noEmit

lint: install-frontend ## ESLint sobre frontend
	@cd $(FRONTEND_DIR) && $(NPM) run lint

# ─── Build de producción ─────────────────────────────────────────────────────

build: build-frontend ## Build de producción (frontend dist/ + copia a backend/static/)
	@mkdir -p $(BACKEND_DIR)/src/kratos/static
	@rm -rf $(BACKEND_DIR)/src/kratos/static/*
	@cp -r $(FRONTEND_DIR)/dist/* $(BACKEND_DIR)/src/kratos/static/
	@echo "→ Frontend bundled en $(BACKEND_DIR)/src/kratos/static/"

build-frontend: install-frontend
	@cd $(FRONTEND_DIR) && $(NPM) run build

# ─── Docker ──────────────────────────────────────────────────────────────────

docker-build: ## docker compose build
	@docker compose build

docker-up: ## docker compose up -d
	@docker compose up -d

docker-down: ## docker compose down
	@docker compose down

# ─── Limpieza ────────────────────────────────────────────────────────────────

stop: ## Mata uvicorn/vite que se hayan quedado colgados en los puertos por defecto
	@-pkill -f "uvicorn kratos.main:app" 2>/dev/null || true
	@-pkill -f "vite" 2>/dev/null || true
	@echo "→ procesos detenidos"

clean: ## Borra artefactos de build (dist, static, __pycache__, .pytest_cache)
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(BACKEND_DIR)/src/kratos/static/*
	@find $(BACKEND_DIR) -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find $(BACKEND_DIR) -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	@find $(BACKEND_DIR) -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true

clean-db: ## ⚠ Borra la DB local (data/voting.db)
	@rm -f $(BACKEND_DIR)/data/voting.db* $(BACKEND_DIR)/data/smoke.db*

distclean: clean clean-db ## Limpieza total: build + DB + venv + node_modules
	@rm -rf $(VENV)
	@rm -rf $(FRONTEND_DIR)/node_modules
