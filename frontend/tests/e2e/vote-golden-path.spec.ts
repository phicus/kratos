import { test, expect, request } from '@playwright/test';

// `process` proviene de Node; Playwright corre en Node, así que es seguro.
declare const process: { env: Record<string, string | undefined> };
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

/**
 * Pre-requisitos para correr este test:
 *
 *   1. Levantar el backend con ENV=test (habilita /auth/test/login):
 *        cd backend
 *        ENV=test SESSION_SECRET=test-secret \
 *        DB_PATH=./data/test-voting.db \
 *        .venv/bin/python -m kratos.db init
 *        ENV=test SESSION_SECRET=test-secret \
 *        DB_PATH=./data/test-voting.db \
 *        .venv/bin/uvicorn kratos.main:app --port 8000 &
 *
 *   2. Sembrar al menos 1 propuesta y abrir el periodo:
 *        sqlite3 backend/data/test-voting.db \
 *          "INSERT INTO proposals(name,description,status) VALUES ('Prop','D','votable');
 *           UPDATE periods SET state='abierto' WHERE id=1;"
 *
 *   3. Levantar el frontend en otro terminal:
 *        cd frontend && pnpm dev
 *
 *   4. Correr el test:
 *        pnpm test:e2e
 */
test('golden path: login → vote → already-voted', async ({ page, baseURL }) => {
  // Crear la sesión vía el endpoint de test (sin pasar por Google OAuth).
  const api = await request.newContext();
  const login = await api.post(`${BACKEND}/auth/test/login?email=tester@phicus.es`);
  expect(login.status()).toBe(204);
  const cookies = (await api.storageState()).cookies;
  await page.context().addCookies(
    cookies.map((c) => ({ ...c, url: baseURL ?? 'http://localhost:5173' })),
  );

  // Home redirige a Vote porque el periodo está abierto.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Tu papeleta/i })).toBeVisible({ timeout: 5_000 });

  // Puntuar todas las propuestas con 7.
  const radios = page.getByRole('radio', { name: '7' });
  const count = await radios.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await radios.nth(i).click();
  }

  // Enviar y confirmar.
  await page.getByRole('button', { name: /Enviar papeleta$/i }).click();
  await page.getByRole('button', { name: /Enviar papeleta$/i }).last().click();

  // Redirige a AlreadyVoted.
  await expect(page.getByRole('heading', { name: /Ya has votado/i })).toBeVisible({
    timeout: 5_000,
  });
});
