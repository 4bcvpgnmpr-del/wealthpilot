/**
 * Motor financiero de WealthPilot.
 *
 * Reglas de diseño:
 * - Funciones puras: mismo input -> mismo output, sin acceso a DB ni red.
 * - Nunca inventan datos: si falta un input requerido, se lanza un error
 *   explícito en vez de asumir un valor por defecto silencioso.
 * - Son la ÚNICA fuente de verdad para los cálculos financieros. Tanto el
 *   dashboard como la IA (lib/ai) deben leer de aquí, nunca recalcular
 *   por su cuenta.
 */

export interface MoneyFlowInput {
  monthlyIncomeTotal: number;
  monthlyExpenseTotal: number;
  targetSavingsRate?: number; // 0-1, opcional. Si no se da, se usa 0.
}

export interface MoneyFlowResult {
  income: number;
  expenses: number;
  savingsCapacity: number; // ingresos - gastos
  targetSavings: number; // savingsCapacity * targetSavingsRate
  availableToInvest: number; // savingsCapacity - targetSavings
}

/**
 * INGRESOS - GASTOS = CAPACIDAD DE AHORRO
 * CAPACIDAD DE AHORRO - AHORRO OBJETIVO = DISPONIBLE PARA INVERTIR
 */
export function calculateMonthlyFlow(input: MoneyFlowInput): MoneyFlowResult {
  const { monthlyIncomeTotal, monthlyExpenseTotal, targetSavingsRate = 0 } = input;

  if (monthlyIncomeTotal < 0 || monthlyExpenseTotal < 0) {
    throw new Error("Los importes de ingresos y gastos no pueden ser negativos.");
  }
  if (targetSavingsRate < 0 || targetSavingsRate > 1) {
    throw new Error("targetSavingsRate debe estar entre 0 y 1.");
  }

  const savingsCapacity = monthlyIncomeTotal - monthlyExpenseTotal;
  const targetSavings = Math.max(savingsCapacity, 0) * targetSavingsRate;
  const availableToInvest = savingsCapacity - targetSavings;

  return {
    income: monthlyIncomeTotal,
    expenses: monthlyExpenseTotal,
    savingsCapacity,
    targetSavings,
    availableToInvest: Math.max(availableToInvest, 0),
  };
}

export interface GoalProgressInput {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: Date;
  today?: Date;
}

export interface GoalProgressResult {
  progressPct: number; // 0-100
  amountMissing: number;
  monthsRemaining: number | null; // null si no hay fecha objetivo
  requiredMonthlyContribution: number | null; // para llegar a tiempo
  onTrack: boolean | null;
}

export function calculateGoalProgress(input: GoalProgressInput): GoalProgressResult {
  const { targetAmount, currentAmount, monthlyContribution, targetDate } = input;
  const today = input.today ?? new Date();

  if (targetAmount <= 0) throw new Error("targetAmount debe ser mayor que 0.");

  const progressPct = Math.min((currentAmount / targetAmount) * 100, 100);
  const amountMissing = Math.max(targetAmount - currentAmount, 0);

  let monthsRemaining: number | null = null;
  let requiredMonthlyContribution: number | null = null;
  let onTrack: boolean | null = null;

  if (targetDate) {
    const msRemaining = targetDate.getTime() - today.getTime();
    monthsRemaining = Math.max(Math.ceil(msRemaining / (1000 * 60 * 60 * 24 * 30.44)), 0);

    requiredMonthlyContribution =
      monthsRemaining > 0 ? amountMissing / monthsRemaining : amountMissing;

    onTrack = monthlyContribution >= requiredMonthlyContribution;
  }

  return { progressPct, amountMissing, monthsRemaining, requiredMonthlyContribution, onTrack };
}

export interface CompoundGrowthInput {
  initialCapital: number;
  monthlyContribution: number;
  annualContributionGrowth?: number; // 0-1, ej 0.02 = 2% anual
  years: number;
  annualReturnRate: number; // 0-1, ej 0.07 = 7%
  annualInflationRate?: number; // 0-1, opcional
}

export interface CompoundGrowthYearPoint {
  year: number;
  nominalValue: number;
  realValue: number; // ajustado a inflación si se proporcionó
  totalContributed: number;
}

export interface CompoundGrowthResult {
  finalNominalValue: number;
  finalRealValue: number;
  totalContributed: number;
  totalGrowth: number;
  yearlyBreakdown: CompoundGrowthYearPoint[];
}

/**
 * Proyección de crecimiento compuesto mes a mes, con aportaciones crecientes
 * e inflación opcional. Usado por el Simulador (3 escenarios) y por el
 * Plan de Inversión.
 */
export function simulateCompoundGrowth(input: CompoundGrowthInput): CompoundGrowthResult {
  const {
    initialCapital,
    monthlyContribution,
    annualContributionGrowth = 0,
    years,
    annualReturnRate,
    annualInflationRate = 0,
  } = input;

  if (years <= 0) throw new Error("years debe ser mayor que 0.");
  if (initialCapital < 0 || monthlyContribution < 0) {
    throw new Error("Los importes no pueden ser negativos.");
  }

  const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1;
  const monthlyInflationRate = Math.pow(1 + annualInflationRate, 1 / 12) - 1;

  let value = initialCapital;
  let totalContributed = initialCapital;
  let currentMonthlyContribution = monthlyContribution;

  const yearlyBreakdown: CompoundGrowthYearPoint[] = [];
  let inflationFactor = 1;

  const totalMonths = years * 12;
  for (let month = 1; month <= totalMonths; month++) {
    value = value * (1 + monthlyReturnRate) + currentMonthlyContribution;
    totalContributed += currentMonthlyContribution;
    inflationFactor *= 1 + monthlyInflationRate;

    // aumentar la aportación cada 12 meses
    if (month % 12 === 0) {
      currentMonthlyContribution *= 1 + annualContributionGrowth;

      yearlyBreakdown.push({
        year: month / 12,
        nominalValue: round2(value),
        realValue: round2(value / inflationFactor),
        totalContributed: round2(totalContributed),
      });
    }
  }

  return {
    finalNominalValue: round2(value),
    finalRealValue: round2(value / inflationFactor),
    totalContributed: round2(totalContributed),
    totalGrowth: round2(value - totalContributed),
    yearlyBreakdown,
  };
}

/** Los tres escenarios estándar que pide el spec: conservador, moderado, optimista */
export const SCENARIO_RETURN_RATES = {
  conservador: 0.04,
  moderado: 0.07,
  optimista: 0.09,
} as const;

export function simulateThreeScenarios(
  input: Omit<CompoundGrowthInput, "annualReturnRate">
) {
  return {
    conservador: simulateCompoundGrowth({ ...input, annualReturnRate: SCENARIO_RETURN_RATES.conservador }),
    moderado: simulateCompoundGrowth({ ...input, annualReturnRate: SCENARIO_RETURN_RATES.moderado }),
    optimista: simulateCompoundGrowth({ ...input, annualReturnRate: SCENARIO_RETURN_RATES.optimista }),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
