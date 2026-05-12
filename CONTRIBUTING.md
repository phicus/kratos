# Contribuir a Kratos

## Cómo ejecutar CI en local

```bash
make ci
```

Reproduce **exactamente** la matriz de checks que ejecuta GitHub Actions
(`backend` + `frontend`) sobre tu working copy actual. Si pasa en local,
pasa en CI. Si diverge, hay un bug y se trata como tal — la fuente de
verdad es el workflow en `.github/workflows/ci.yml`.

Si quieres ejecutar solo una parte:

```bash
make ci-backend          # ruff + black + pytest
make ci-frontend         # tsc + eslint + prettier + vitest + vite build
make ci-backend-tests    # sólo pytest
make ci-frontend-tests   # sólo vitest
```

Para auto-formatear (no se ejecuta nunca en CI):

```bash
make format              # ruff --fix + black + prettier --write
```

Para troubleshooting de errores de CI: ver `specs/003-ci-pipeline/quickstart.md §9`.

## Cómo añadir un check nuevo

Si quieres añadir un nuevo paso de verificación (p.ej. `mypy`, audit de
dependencias, etc.):

1. Añadir el comando como sub-target en el `Makefile` (p.ej.
   `ci-backend-mypy`).
2. Incluirlo en la orquestación de `ci-backend` o `ci-frontend`.
3. Reflejar el mismo comando como step nuevo en
   `.github/workflows/ci.yml`.
4. Verificar paridad: `make ci` local y la próxima ejecución de CI deben
   incluir el nuevo step con el mismo nombre canónico.
5. Si el nuevo check debe **bloquear merges**, añadir el job/step a la
   configuración de branch protection (ver sección siguiente).

## Branch protection rules

Configuración manual desde la UI de GitHub que protege `main` exigiendo
que la matriz CI pase antes de mergear cualquier PR.

**Quién la configura**: cualquier admin del repo (`jgomez@phicus.es`,
`epastor@phicus.es`).

**Cuándo**: una sola vez, al adoptar esta feature. Sólo se vuelve a tocar
si se añade un nuevo job/check al workflow o se cambia el patrón de
ramas protegidas.

**Procedimiento paso a paso**:

1. Navega a `Settings` → `Branches` → `Add rule`.
2. **Branch name pattern**: `main`.
3. Marcar las siguientes opciones:
   - ☑ Require a pull request before merging
     - ☑ Require approvals: **1**
   - ☑ Require status checks to pass before merging
     - ☑ Require branches to be up to date before merging
     - En el campo de búsqueda de status checks, escribir y añadir:
       - `backend`
       - `frontend`
     - (No añadir `docker-build`: ese check sólo corre en `main`/tags,
       no en PR, así que requerirlo en PR sería incumplible.)
   - ☑ Require conversation resolution before merging
   - ☑ Do not allow bypassing the above settings (esto incluye admins)
4. Pulsar `Create`.

**Verificación** (línea de comandos, requiere `gh` autenticado):

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
   --jq '.required_status_checks.contexts'
# Debe imprimir: ["backend","frontend"]
```

Si la salida no contiene exactamente esos dos contextos, los PRs no
quedarán bloqueados aunque CI esté en rojo.

## Cuando CI falla en main

Si tras un merge a `main` el workflow se ejecuta y termina en rojo,
GitHub envía email automático al autor del commit (campo
`commit.author.email`). El procedimiento estándar:

1. **NO** hacer commit directo en `main` (las reglas lo permiten para
   admins pero el resto del repo se rompe si saltas branch protection).
2. Abrir un PR con `git revert <sha>` del commit problemático, o con el
   fix concreto.
3. Esperar a que CI pase en verde sobre ese PR.
4. Mergear vía UI (que respeta branch protection).

Hot-fixes mergeados directamente saltando las reglas dejan `main` en un
estado donde futuros PRs pueden fallar por dependencias no obvias. Si
realmente hace falta saltarse las reglas (una vez al año), documentar el
motivo en el commit message.

## Descargar artifacts de un release

Cada ejecución verde de CI en `main` o tags `v*` deja como artifact:

- `kratos-image-<sha>.tar.gz` — imagen Docker exportada
- `frontend-dist-<sha>.zip` — bundle estático del frontend

Procedimiento de descarga:

```bash
gh run list --workflow=ci.yml --branch=main --limit=5
gh run download <run-id>
ls -la
# kratos-image-<sha>.tar.gz
# frontend-dist-<sha>.zip
# backend-junit-<sha>.xml
# frontend-junit-<sha>.xml
```

Cargar la imagen Docker localmente:

```bash
docker load -i kratos-image-<sha>.tar.gz
# Loaded image: kratos-phicus:latest
docker compose up   # arranca con la imagen recién cargada
```

Retención por defecto: 90 días para los artifacts de release, 14 días
para los reportes JUnit.
