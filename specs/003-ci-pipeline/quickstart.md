# Quickstart — QA + CI (feature 003)

## 1. Verificar localmente antes de abrir el PR

```bash
make install   # idempotente; sólo si falta venv o node_modules
make ci        # ejecuta TODA la matriz CI en local
```

Salida esperada (tras 2-3 min):

```
─── CI summary ─────────────────────────────────────────
✓ backend-lint
✓ backend-tests        (47 passed)
✓ frontend-typecheck
✓ frontend-lint
✓ frontend-tests       (9 passed)
✓ frontend-build
─────────────────────────────────────────────────────────
Exit code: 0
```

Si algo falla, los nombres de los tests son **idénticos** a los que
verás en GitHub Actions (research.md §4).

## 2. Smoke test del workflow en GitHub

Tras hacer push de la rama:

```bash
gh workflow list                     # debe listar "CI"
gh run list --branch 003-ci-pipeline # debe mostrar la ejecución más reciente
gh run watch                         # sigue el progreso en directo
```

O en la UI: `Actions → CI → última run`. Esperado:

| Job | Estado | Duración típica |
|---|---|---|
| `backend` | ✅ green | ~2 min con cache caliente |
| `frontend` | ✅ green | ~2:30 min con cache caliente |
| `docker-build` | ✅ green | ~1:30 min (sólo en main/tags) |

## 3. Configurar branch protection (UNA SOLA VEZ, manual)

Desde la UI de GitHub:

1. `Settings` → `Branches` → `Add rule`.
2. **Branch name pattern**: `main`.
3. Marcar:
   - ☑ Require a pull request before merging
     - ☑ Require approvals: **1**
   - ☑ Require status checks to pass before merging
     - ☑ Require branches to be up to date before merging
     - Search and add: `backend`, `frontend`
   - ☑ Require conversation resolution before merging
   - ☑ Do not allow bypassing the above settings (esto incluye admins)
4. `Create`.

**Verificación** (vía API):

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
   --jq '.required_status_checks.contexts'
# Esperado: ["backend","frontend"]
```

## 4. Probar que CI bloquea un PR roto

```bash
git checkout -b prueba-bloqueo
# Romper deliberadamente un test innegociable, p.ej.:
sed -i 's/assert offenders == \[\]/assert offenders == ["bug"]/' \
   backend/tests/integration/test_vote_anonymity.py
git commit -am "BREAK: provocar fallo intencional para validar branch protection"
git push -u origin prueba-bloqueo
gh pr create --fill
```

En GitHub:

- El check `backend` aparece en rojo en la pestaña Checks del PR.
- El botón "Merge pull request" muestra "Required statuses must pass
  before merging" y queda **deshabilitado**.
- En `Actions → CI → la run`, dentro del job `backend`, paso "Tests",
  se ve la línea:
  ```
  FAILED tests/integration/test_vote_anonymity.py::test_vote_scores_schema_has_no_user_columns
  ```

**Limpieza** después del experimento:

```bash
git checkout main
git branch -D prueba-bloqueo
git push origin --delete prueba-bloqueo
# Cerrar el PR sin merge desde la UI.
```

## 5. Descargar artifacts de una run verde

Sólo en `main` o tags `v*`:

```bash
gh run download <run-id>
ls
# kratos-image-<sha>.tar.gz
# frontend-dist-<sha>.zip
# backend-junit-<sha>.xml
# frontend-junit-<sha>.xml
```

Cargar la imagen Docker localmente:

```bash
docker load -i kratos-image-<sha>.tar.gz
# Loaded image: kratos-phicus:latest
```

## 6. Re-ejecutar el workflow manualmente

Desde la UI: `Actions → CI → Run workflow → main`.

O CLI:

```bash
gh workflow run ci.yml --ref main
gh run watch
```

## 7. Auto-formatear en local antes de commitear

CI **no** autofixea (research.md §8). Para arreglar formato/lint:

```bash
make format
```

Luego revisar el diff antes de commitear (`git diff`).

## 8. Pre-merge checklist

- [ ] `make ci` pasa en local con exit 0.
- [ ] El PR está rebased sobre `main` actual.
- [ ] Los checks `backend` y `frontend` aparecen en verde en la
      pestaña "Checks" del PR.
- [ ] El reviewer ha dejado al menos una aprobación.
- [ ] No hay conversaciones sin resolver.
- [ ] (Si la feature toca la constitución) los tres tests innegociables
      siguen en el job `backend` y NO se han excluido.

## 9. Resolución de problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Cache miss en CI cada PR | `package-lock.json` cambia involuntariamente | Asegurar que `npm install` no se ejecuta sin necesidad; usar `npm ci` en CI |
| `make ci` pasa, CI falla | Diferencia de entorno (locale, line endings) | Comparar versiones de Python/Node: deben ser 3.11 y 20 exactas |
| El check `backend` aparece pero no "required" | Branch protection no incluye el nombre exacto | Revisar paso 3.4: el contexto se llama `backend`, NO `backend / tests` |
| Job `docker-build` falla en PR | Está mal condicionado (debería saltarse en PR) | Verificar la condición `if:` en `ci.yml` |
| Workflow no se dispara en push | Falta `branches: [main]` o el push fue a otra rama | Revisar triggers en `ci.yml` |
| `gh run watch` sale antes de tiempo | Versión vieja del `gh` CLI | Actualizar `gh >= 2.40` |
