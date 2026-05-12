-- Feature 002 — Admin Dashboard: aforo esperado por periodo.
-- Aditivo: columna nullable, sin reescritura de la tabla.
ALTER TABLE periods ADD COLUMN expected_quorum INTEGER NULL;
