import { describe, it, expect } from "vitest";
import { calculateInvestmentAllocation } from "./allocation";

describe("calculateInvestmentAllocation", () => {
  it("los porcentajes de cada perfil suman 100", () => {
    const categories = ["CONSERVADOR", "MODERADO", "EQUILIBRADO", "DINAMICO", "AGRESIVO"] as const;
    for (const riskCategory of categories) {
      const result = calculateInvestmentAllocation({ availableCapital: 1000, riskCategory });
      const totalPct = result.allocations.reduce((sum, a) => sum + a.pct, 0);
      expect(totalPct).toBe(100);
    }
  });

  it("los importes de cada línea suman el capital disponible total", () => {
    const result = calculateInvestmentAllocation({ availableCapital: 400, riskCategory: "EQUILIBRADO" });
    const totalAmount = result.allocations.reduce((sum, a) => sum + a.amount, 0);
    expect(totalAmount).toBeCloseTo(400, 1);
  });

  it("perfil conservador prioriza renta fija y liquidez sobre renta variable", () => {
    const result = calculateInvestmentAllocation({ availableCapital: 1000, riskCategory: "CONSERVADOR" });
    const bonds = result.allocations.find((a) => a.bucket === "BONDS")?.pct ?? 0;
    const cash = result.allocations.find((a) => a.bucket === "CASH")?.pct ?? 0;
    const etf = result.allocations.find((a) => a.bucket === "ETF_GLOBAL")?.pct ?? 0;
    expect(bonds + cash).toBeGreaterThan(etf);
  });

  it("perfil agresivo prioriza renta variable sobre renta fija y liquidez", () => {
    const result = calculateInvestmentAllocation({ availableCapital: 1000, riskCategory: "AGRESIVO" });
    const bonds = result.allocations.find((a) => a.bucket === "BONDS")?.pct ?? 0;
    const cash = result.allocations.find((a) => a.bucket === "CASH")?.pct ?? 0;
    const etf = result.allocations.find((a) => a.bucket === "ETF_GLOBAL")?.pct ?? 0;
    const usStocks = result.allocations.find((a) => a.bucket === "US_STOCKS")?.pct ?? 0;
    expect(etf + usStocks).toBeGreaterThan(bonds + cash);
  });

  it("rechaza capital negativo", () => {
    expect(() => calculateInvestmentAllocation({ availableCapital: -100, riskCategory: "MODERADO" })).toThrow();
  });

  it("no incluye líneas con 0% (ej. sin renta variable USA en conservador)", () => {
    const result = calculateInvestmentAllocation({ availableCapital: 1000, riskCategory: "CONSERVADOR" });
    expect(result.allocations.every((a) => a.pct > 0)).toBe(true);
  });
});
