-- WealthPilot — Categorías personalizadas e iconos
-- 1. Asset.type deja de ser un enum rígido y pasa a texto libre (como Income.category,
--    Expense.category y Liability.type). Los valores existentes (CASH, BANK_ACCOUNT…)
--    se conservan tal cual al convertir, así que no se pierde ningún dato.
-- 2. Columna opcional "icon" (emoji) en ingresos, gastos, activos y deudas.
-- 3. Tabla user_categories para las categorías que crea cada usuario a mano.

ALTER TABLE "assets" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;
DROP TYPE "AssetType";

ALTER TABLE "incomes"     ADD COLUMN "icon" TEXT;
ALTER TABLE "expenses"    ADD COLUMN "icon" TEXT;
ALTER TABLE "assets"      ADD COLUMN "icon" TEXT;
ALTER TABLE "liabilities" ADD COLUMN "icon" TEXT;

CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE', 'ASSET', 'LIABILITY');

CREATE TABLE "user_categories" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" "CategoryKind" NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "kind", "name")
);
CREATE INDEX ON "user_categories" ("userId");
