import { describe, it, expect } from "vitest";
import { calculateRiskProfile } from "./scoring";

describe("calculateRiskProfile", () => {
  it("asigna CONSERVADOR a un perfil con todas las señales de bajo riesgo", () => {
    const result = calculateRiskProfile({
      age: 62,
      investingExperience: "ninguna",
      timeHorizonYears: 1,
      lossReactionScenario: "vendo_todo",
      liquidityNeed: "alta",
      primaryGoal: "preservar_capital",
    });
    expect(result.category).toBe("CONSERVADOR");
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("asigna AGRESIVO a un perfil con todas las señales de alto riesgo", () => {
    const result = calculateRiskProfile({
      age: 25,
      investingExperience: "avanzada",
      timeHorizonYears: 20,
      lossReactionScenario: "compro_mas",
      liquidityNeed: "baja",
      primaryGoal: "crecimiento_alto",
    });
    expect(result.category).toBe("AGRESIVO");
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("los pesos del modelo de puntuación suman 1.0 (documentado, no arbitrario)", () => {
    const result = calculateRiskProfile({
      age: 40,
      investingExperience: "basica",
      timeHorizonYears: 5,
      lossReactionScenario: "no_hago_nada",
      liquidityNeed: "media",
      primaryGoal: "crecimiento_moderado",
    });
    const totalWeight = result.breakdown.reduce((sum, b) => sum + b.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 5);
  });

  it("cada pregunta aparece en el breakdown con su contribución ponderada", () => {
    const result = calculateRiskProfile({
      age: 30,
      investingExperience: "intermedia",
      timeHorizonYears: 8,
      lossReactionScenario: "vendo_parte",
      liquidityNeed: "media",
      primaryGoal: "crecimiento_moderado",
    });
    expect(result.breakdown).toHaveLength(6);
    for (const b of result.breakdown) {
      expect(b.weightedContribution).toBeCloseTo(b.rawScore * b.weight, 5);
    }
  });
});
