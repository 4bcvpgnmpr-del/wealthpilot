/**
 * Motor de generación de alertas (spec sección 15).
 *
 * Reglas puras: reciben datos ya calculados (nunca acceden a DB) y devuelven
 * una lista de alertas candidatas. La ruta API decide cuáles persistir,
 * evitando duplicados.
 */

export type AlertType =
  | "MONTHLY_AVAILABLE"
  | "GOAL_PROGRESS"
  | "EMERGENCY_FUND_LOW"
  | "PORTFOLIO_CHANGE"
  | "MISSED_CONTRIBUTION";

export interface GeneratedAlert {
  type: AlertType;
  message: string;
}

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function generateMonthlyAvailableAlert(availableToInvest: number): GeneratedAlert | null {
  if (availableToInvest <= 0) return null;
  return {
    type: "MONTHLY_AVAILABLE",
    message: `Este mes tienes ${formatEUR(availableToInvest)} disponibles para invertir.`,
  };
}

export function generateGoalProgressAlerts(
  goals: { name: string; progressPct: number }[]
): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];
  for (const goal of goals) {
    if (goal.progressPct >= 100) {
      alerts.push({ type: "GOAL_PROGRESS", message: `¡Has alcanzado tu objetivo "${goal.name}"!` });
    } else if (goal.progressPct >= 75) {
      alerts.push({ type: "GOAL_PROGRESS", message: `Has alcanzado el 75% de tu objetivo "${goal.name}".` });
    } else if (goal.progressPct >= 50) {
      alerts.push({ type: "GOAL_PROGRESS", message: `Has alcanzado el 50% de tu objetivo "${goal.name}".` });
    }
  }
  return alerts;
}

export function generateEmergencyFundAlert(
  emergencyFundCurrent: number,
  emergencyFundTarget: number
): GeneratedAlert | null {
  if (emergencyFundTarget <= 0) return null;
  const pct = (emergencyFundCurrent / emergencyFundTarget) * 100;
  if (pct >= 100) return null;
  return {
    type: "EMERGENCY_FUND_LOW",
    message: `Tu fondo de emergencia está al ${Math.round(pct)}% de tu objetivo (por debajo del 100%).`,
  };
}

export function generatePortfolioChangeAlert(gainLossPct: number, threshold = 10): GeneratedAlert | null {
  if (Math.abs(gainLossPct) < threshold) return null;
  const direction = gainLossPct >= 0 ? "subido" : "bajado";
  return {
    type: "PORTFOLIO_CHANGE",
    message: `Tu cartera ha ${direction} un ${Math.abs(gainLossPct).toFixed(1)}% desde que empezaste a invertir.`,
  };
}

export function generateMissedContributionAlerts(
  goals: { name: string; monthlyContribution: number; onTrack: boolean | null }[]
): GeneratedAlert[] {
  return goals
    .filter((g) => g.onTrack === false && g.monthlyContribution > 0)
    .map((g) => ({
      type: "MISSED_CONTRIBUTION" as const,
      message: `Tu aportación mensual a "${g.name}" es menor de la necesaria para llegar a tiempo.`,
    }));
}
