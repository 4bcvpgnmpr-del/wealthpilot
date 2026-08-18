import { describe, it, expect } from "vitest";
import {
  generateMonthlyAvailableAlert,
  generateGoalProgressAlerts,
  generateEmergencyFundAlert,
  generatePortfolioChangeAlert,
  generateMissedContributionAlerts,
} from "./alerts";

describe("generateMonthlyAvailableAlert", () => {
  it("genera alerta cuando hay disponible para invertir", () => {
    const alert = generateMonthlyAvailableAlert(350);
    expect(alert?.message).toContain("350");
  });

  it("no genera alerta si no hay disponible", () => {
    expect(generateMonthlyAvailableAlert(0)).toBeNull();
  });
});

describe("generateGoalProgressAlerts", () => {
  it("genera alerta al alcanzar el 50%", () => {
    const alerts = generateGoalProgressAlerts([{ name: "Fondo emergencia", progressPct: 52 }]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("50%");
  });

  it("genera alerta especial al alcanzar el 100%", () => {
    const alerts = generateGoalProgressAlerts([{ name: "Coche", progressPct: 100 }]);
    expect(alerts[0].message).toContain("alcanzado");
  });

  it("no genera alerta por debajo del 50%", () => {
    const alerts = generateGoalProgressAlerts([{ name: "Viaje", progressPct: 30 }]);
    expect(alerts).toHaveLength(0);
  });
});

describe("generateEmergencyFundAlert", () => {
  it("alerta si el fondo está por debajo del objetivo", () => {
    const alert = generateEmergencyFundAlert(4000, 6000);
    expect(alert?.message).toContain("67%");
  });

  it("no alerta si el fondo ya cumplió o superó el objetivo", () => {
    expect(generateEmergencyFundAlert(6000, 6000)).toBeNull();
    expect(generateEmergencyFundAlert(7000, 6000)).toBeNull();
  });
});

describe("generatePortfolioChangeAlert", () => {
  it("alerta ante cambios significativos (>10% por defecto)", () => {
    const alert = generatePortfolioChangeAlert(15);
    expect(alert?.message).toContain("subido");
  });

  it("alerta también en caídas fuertes", () => {
    const alert = generatePortfolioChangeAlert(-20);
    expect(alert?.message).toContain("bajado");
  });

  it("no alerta ante cambios pequeños", () => {
    expect(generatePortfolioChangeAlert(3)).toBeNull();
  });
});

describe("generateMissedContributionAlerts", () => {
  it("alerta solo para objetivos con aportación insuficiente", () => {
    const alerts = generateMissedContributionAlerts([
      { name: "Coche", monthlyContribution: 100, onTrack: false },
      { name: "Jubilación", monthlyContribution: 200, onTrack: true },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("Coche");
  });
});
