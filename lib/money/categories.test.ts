import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  collidesWithDefault,
  mergeCategories,
  normalizeCategoryName,
  resolveCategory,
} from "./categories";

describe("categorías de Mi Dinero", () => {
  it("las claves predefinidas coinciden con los valores ya guardados en la BD desde la Fase 2", () => {
    expect(DEFAULT_CATEGORIES.INCOME.map((c) => c.key)).toEqual(["salario", "alquileres", "trabajos_extra", "dividendos", "otros"]);
    expect(DEFAULT_CATEGORIES.ASSET.map((c) => c.key)).toEqual(["CASH", "BANK_ACCOUNT", "DEPOSIT", "EMERGENCY_FUND", "OTHER"]);
    expect(DEFAULT_CATEGORIES.LIABILITY.map((c) => c.key)).toEqual(["hipoteca", "prestamo_personal", "prestamo_coche", "tarjeta", "otros"]);
    expect(DEFAULT_CATEGORIES.EXPENSE).toHaveLength(9);
  });

  it("normaliza nombres ignorando mayúsculas, tildes, espacios y guiones bajos", () => {
    expect(normalizeCategoryName("  Alimentación ")).toBe("alimentacion");
    expect(normalizeCategoryName("Trabajos_Extra")).toBe("trabajos extra");
  });

  it("detecta choques con las predefinidas por clave o por etiqueta", () => {
    expect(collidesWithDefault("EXPENSE", "alimentacion")).toBe(true);
    expect(collidesWithDefault("EXPENSE", "ALIMENTACIÓN")).toBe(true);
    expect(collidesWithDefault("ASSET", "cuenta bancaria")).toBe(true);
    expect(collidesWithDefault("ASSET", "bank_account")).toBe(true);
    expect(collidesWithDefault("EXPENSE", "Mascotas")).toBe(false);
    // "Salario" es de ingresos, no de gastos
    expect(collidesWithDefault("EXPENSE", "Salario")).toBe(false);
  });

  it("mezcla predefinidas + propias solo del tipo pedido", () => {
    const custom = [
      { id: "1", kind: "EXPENSE", name: "Mascotas", icon: "🐶" },
      { id: "2", kind: "ASSET", name: "Criptomonedas", icon: "🪙" },
    ];
    const merged = mergeCategories("EXPENSE", custom);
    expect(merged).toHaveLength(10);
    expect(merged.at(-1)).toEqual({ key: "Mascotas", label: "Mascotas", icon: "🐶", custom: true, id: "1" });
  });

  it("resuelve el icono: propio del registro > de la categoría > genérico", () => {
    const opts = mergeCategories("ASSET", []);
    expect(resolveCategory(opts, "CASH")).toEqual({ label: "Efectivo", icon: "💵" });
    expect(resolveCategory(opts, "CASH", "🐷")).toEqual({ label: "Efectivo", icon: "🐷" });
    // una categoría propia borrada se sigue mostrando con su texto, nunca se pierde
    expect(resolveCategory(opts, "Criptomonedas")).toEqual({ label: "Criptomonedas", icon: "🏷️" });
  });
});
