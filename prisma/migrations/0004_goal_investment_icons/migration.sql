-- WealthPilot — Icono propio (emoji) en objetivos e inversiones.
-- Columnas opcionales: null = se usa el icono por defecto del tipo/categoría.
ALTER TABLE "goals"       ADD COLUMN "icon" TEXT;
ALTER TABLE "investments" ADD COLUMN "icon" TEXT;
