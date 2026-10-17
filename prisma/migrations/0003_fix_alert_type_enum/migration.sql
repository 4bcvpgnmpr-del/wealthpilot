-- WealthPilot — Corrige una discrepancia entre schema.prisma y la base de datos
-- schema.prisma declara Alert.type como enum AlertType, pero la migración inicial
-- (escrita a mano) creó la columna como TEXT y nunca creó el tipo "AlertType".
-- Prisma convierte los valores de enum a ese tipo al escribir, así que guardar una
-- alerta fallaba con: type "public.AlertType" does not exist.
-- Los valores existentes (si los hay) se conservan al convertir.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AlertType') THEN
    CREATE TYPE "AlertType" AS ENUM ('MONTHLY_AVAILABLE', 'GOAL_PROGRESS', 'EMERGENCY_FUND_LOW', 'PORTFOLIO_CHANGE', 'MISSED_CONTRIBUTION');
  END IF;
END $$;

ALTER TABLE "alerts" ALTER COLUMN "type" TYPE "AlertType" USING "type"::"AlertType";
