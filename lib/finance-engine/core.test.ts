import { describe, it, expect } from "vitest";
import { calculateMonthlyFlow, calculateGoalProgress, simulateCompoundGrowth } from "./core";

describe("calculateMonthlyFlow", () => {
  it("calcula capacidad de ahorro y disponible para invertir", () => {
    const result = calculateMonthlyFlow({
      monthlyIncomeTotal: 1800,
      monthlyExpenseTotal: 1050,
      targetSavingsRate: 0.25, // ahorro objetivo = 25% de la capacidad
    });
    expect(result.savingsCapacity).toBe(750);
    expect(result.targetSavings).toBe(187.5);
    expect(result.availableToInvest).toBe(562.5);
  });

  it("nunca da disponible negativo aunque los gastos superen ingresos", () => {
    const result = calculateMonthlyFlow({ monthlyIncomeTotal: 1000, monthlyExpenseTotal: 1200 });
    expect(result.savingsCapacity).toBe(-200);
    expect(result.availableToInvest).toBe(0);
  });

  it("rechaza importes negativos", () => {
    expect(() => calculateMonthlyFlow({ monthlyIncomeTotal: -100, monthlyExpenseTotal: 0 })).toThrow();
  });
});

describe("calculateGoalProgress", () => {
  it("calcula progreso, faltante y aportación requerida con fecha objetivo", () => {
    const today = new Date("2026-01-01");
    const targetDate = new Date("2027-01-01"); // 12 meses
    const result = calculateGoalProgress({
      targetAmount: 12000,
      currentAmount: 3000,
      monthlyContribution: 500,
      targetDate,
      today,
    });
    expect(result.progressPct).toBe(25);
    expect(result.amountMissing).toBe(9000);
    expect(result.monthsRemaining).toBe(12);
    expect(result.requiredMonthlyContribution).toBe(750);
    expect(result.onTrack).toBe(false); // 500 < 750
  });

  it("sin fecha objetivo no calcula meses ni onTrack", () => {
    const result = calculateGoalProgress({ targetAmount: 1000, currentAmount: 500, monthlyContribution: 50 });
    expect(result.monthsRemaining).toBeNull();
    expect(result.onTrack).toBeNull();
  });

  it("usa una aproximación de 30.44 días/mes, así que un plazo de 2 años con año bisiesto de más meses de los esperados de forma naive", () => {
    // 2026-08-14 -> 2028-08-14 son 731 días (incluye 29 feb 2028), no 730.
    // 731 / 30.44 ≈ 24.01 -> ceil = 25. Documentado para que no sorprenda en el futuro.
    const result = calculateGoalProgress({
      targetAmount: 15000,
      currentAmount: 3000,
      monthlyContribution: 300,
      targetDate: new Date("2028-08-14"),
      today: new Date("2026-08-14"),
    });
    expect(result.monthsRemaining).toBe(25);
  });
});

describe("simulateCompoundGrowth", () => {
  it("con 0% de rentabilidad, el valor final = capital inicial + aportaciones", () => {
    const result = simulateCompoundGrowth({
      initialCapital: 1000,
      monthlyContribution: 100,
      years: 2,
      annualReturnRate: 0,
    });
    expect(result.finalNominalValue).toBeCloseTo(1000 + 100 * 24, 2);
    expect(result.totalGrowth).toBeCloseTo(0, 2);
  });

  it("con rentabilidad positiva, el crecimiento es mayor que cero", () => {
    const result = simulateCompoundGrowth({
      initialCapital: 1000,
      monthlyContribution: 200,
      years: 10,
      annualReturnRate: 0.07,
    });
    expect(result.totalGrowth).toBeGreaterThan(0);
    expect(result.yearlyBreakdown).toHaveLength(10);
  });
});
