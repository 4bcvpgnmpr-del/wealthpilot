import { describe, it, expect } from "vitest";
import { calculatePortfolioSummary } from "./portfolio";

describe("calculatePortfolioSummary", () => {
  it("calcula rentabilidad y peso correctamente para varios activos", () => {
    const result = calculatePortfolioSummary([
      { id: "1", name: "ETF Global", category: "ETF", quantity: 10, purchasePrice: 100, currentPrice: 120 },
      { id: "2", name: "S&P 500", category: "ETF", quantity: 5, purchasePrice: 200, currentPrice: 180 },
    ]);

    // ETF Global: coste 1000, valor 1200, ganancia 200 (20%)
    expect(result.investments[0].gainLoss).toBe(200);
    expect(result.investments[0].gainLossPct).toBe(20);

    // S&P 500: coste 1000, valor 900, pérdida -100 (-10%)
    expect(result.investments[1].gainLoss).toBe(-100);
    expect(result.investments[1].gainLossPct).toBe(-10);

    // Total: coste 2000, valor 2100, ganancia 100 (5%)
    expect(result.totalCurrentValue).toBe(2100);
    expect(result.totalCostBasis).toBe(2000);
    expect(result.totalGainLoss).toBe(100);
    expect(result.totalGainLossPct).toBe(5);

    // Peso: ambos son ETF, deberían sumar 100% en esa categoría
    expect(result.weightByCategory["ETF"]).toBe(100);
  });

  it("cartera vacía no falla y da valores en cero", () => {
    const result = calculatePortfolioSummary([]);
    expect(result.totalCurrentValue).toBe(0);
    expect(result.totalGainLossPct).toBe(0);
    expect(result.investments).toHaveLength(0);
  });

  it("calcula el peso por categoría con categorías mixtas", () => {
    const result = calculatePortfolioSummary([
      { id: "1", name: "ETF", category: "ETF", quantity: 1, purchasePrice: 100, currentPrice: 100 },
      { id: "2", name: "Bono", category: "BOND", quantity: 1, purchasePrice: 100, currentPrice: 100 },
    ]);
    // 50/50 en valor -> 50% cada categoría
    expect(result.weightByCategory["ETF"]).toBe(50);
    expect(result.weightByCategory["BOND"]).toBe(50);
  });
});
