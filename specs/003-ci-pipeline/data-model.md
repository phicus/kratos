# Phase 1 — Data Model: QA + CI

**Branch**: `003-ci-pipeline` · **Date**: 2026-05-12

## Sin entidades persistentes

Esta feature **no introduce, modifica ni consume ninguna tabla SQL,
columna, archivo de datos ni esquema de aplicación**. No hay migración
nueva. La infraestructura CI vive completamente fuera de la base de
datos del producto.

## Entidades operativas (no persistentes)

Las "entidades" relevantes existen fuera de la BD del proyecto, en
plataformas externas:

| Entidad operativa | Dónde vive | Cómo se identifica | Retención |
|---|---|---|---|
| **Workflow run** | GitHub Actions (Service) | `(repo, workflow_id, run_number)` | Indefinida por defecto; logs purgables tras 90 días |
| **Status check** | GitHub Checks API | `(commit_sha, check_name)` | Asociada al commit |
| **Workflow artifact** | GitHub Actions | `(workflow_run_id, artifact_name)` | 14-90 días según configuración (research.md §7) |
| **Branch protection rule** | GitHub Settings | `(repo, branch_pattern)` | Persistente hasta cambio manual |
| **Job log** | GitHub Actions | Stream serializado por step | Visible 90 días, descargable como text |

Ninguna de estas entidades requiere modelado en el código del proyecto.
GitHub gestiona persistencia y retención.

## Invariantes para esta feature

1. **Required checks ↔ tests constitucionales**: la lista de status
   checks configurados como required en branch protection debe contener
   `backend` y `frontend`, y la ejecución del job `backend` debe
   incluir `tests/integration/test_vote_anonymity.py`,
   `tests/integration/test_vote_unicity.py` y
   `tests/contract/test_auth_domain.py`.

   Verificable por `gh api repos/<owner>/<repo>/branches/main/protection`
   (parte del checklist de instalación en `quickstart.md`).

2. **Paridad local-remoto**: la salida de `make ci` y la del workflow
   ejecutándose sobre el mismo commit deben converger en (a) la lista
   de checks ejecutados, (b) los identificadores canónicos de tests
   fallidos, (c) el exit code agregado. Tolera diferencias en
   duración, formato de timestamps y orden estricto de líneas.

3. **No-leak de secretos**: ningún job puede leer
   `${{ secrets.GOOGLE_CLIENT_ID_PROD }}` o equivalentes. Los tests
   usan valores dummy fijados literalmente en el yaml o vía
   `ENV=test`. El propio yaml es código abierto del repo, así que la
   ausencia de referencias a secretos sensibles es verificable por
   inspección.

## Configuración persistente del repo

Existe **una sola pieza de configuración persistente** que esta feature
introduce, y vive en `.github/` (es decir, **en el código del repo**):

- `.github/workflows/ci.yml` — descrito en `contracts/workflow-shape.md`

Y un único cambio en la configuración del repo en GitHub (NO en
código del repo):

- **Branch protection rule** sobre `main` con los 2 checks required.
  Procedimiento documentado en `quickstart.md §3`.
