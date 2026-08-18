/**
 * Motor de propuesta de distribución de inversión.
 *
 * Igual que el sistema de puntuación de riesgo (Fase 4): una tabla de
 * asignación base por categoría de riesgo, documentada y configurable,
 * no una caja negra ni una IA generando números. La IA (Fase 8) solo
 * explica en lenguaje natural el resultado de ESTA función — nunca
 * decide las cifras por su cuenta.
 *
 * IMPORTANTE (spec secciones 8 y 20): esto es una propuesta orientativa,
 * nunca una orden de inversión ni una garantía de rentabilidad.
 */

import type { RiskCategory } from "@/lib/risk-profile/scoring";

export type AssetBucket = "ETF_GLOBAL" | "US_STOCKS" | "BONDS" | "CASH";

export interface AllocationLine {
  bucket: AssetBucket;
  label: string;
  pct: number; // 0-100
  amount: number; // € del capital disponible
}

export interface InvestmentAllocationResult {
  availableCapital: number;
  riskCategory: RiskCategory;
  allocations: AllocationLine[];
  rationale: string;
  riskWarning: string;
}

const BUCKET_LABELS: Record<AssetBucket, string> = {
  ETF_GLOBAL: "ETF global diversificado",
  US_STOCKS: "Renta variable USA",
  BONDS: "Renta fija",
  CASH: "Liquidez",
};

/**
 * Tabla de asignación base por perfil de riesgo. Los porcentajes de cada
 * fila suman 100. Ajustable sin tocar la lógica de cálculo — igual que
 * RISK_SCORING_MODEL en scoring.ts.
 */
const BASE_ALLOCATION_BY_RISK: Record<RiskCategory, Record<AssetBucket, number>> = {
  CONSERVADOR: { ETF_GLOBAL: 20, US_STOCKS: 0, BONDS: 50, CASH: 30 },
  MODERADO: { ETF_GLOBAL: 35, US_STOCKS: 10, BONDS: 35, CASH: 20 },
  EQUILIBRADO: { ETF_GLOBAL: 45, US_STOCKS: 15, BONDS: 25, CASH: 15 },
  DINAMICO: { ETF_GLOBAL: 55, US_STOCKS: 20, BONDS: 15, CASH: 10 },
  AGRESIVO: { ETF_GLOBAL: 60, US_STOCKS: 30, BONDS: 5, CASH: 5 },
};

const RATIONALE_BY_RISK: Record<RiskCategory, string> = {
  CONSERVADOR:
    "Con un perfil conservador, priorizamos preservar tu capital: más de la mitad va a renta fija y liquidez, con una exposición limitada a renta variable para no asumir caídas fuertes.",
  MODERADO:
    "Con un perfil moderado, buscamos un equilibrio con inclinación defensiva: la mayor parte sigue en renta fija y liquidez, con una porción creciente en renta variable para captar algo de crecimiento.",
  EQUILIBRADO:
    "Con un perfil equilibrado, repartimos el capital de forma similar entre crecimiento (ETF y renta variable) y estabilidad (renta fija y liquidez), sin inclinarnos claramente hacia ningún extremo.",
  DINAMICO:
    "Con un perfil dinámico, la mayor parte del capital va a renta variable buscando crecimiento a largo plazo, manteniendo una porción menor en renta fija y liquidez como colchón.",
  AGRESIVO:
    "Con un perfil agresivo, casi todo el capital se destina a renta variable (ETF global y USA) buscando el máximo crecimiento a largo plazo, asumiendo mayor volatilidad a cambio.",
};

const RISK_WARNING_BY_RISK: Record<RiskCategory, string> = {
  CONSERVADOR:
    "Riesgo: bajo. En un escenario de caída de mercado, esta cartera debería verse poco afectada, pero también crecerá menos en los años buenos. Revisa tu perfil si tu situación cambia (ingresos, horizonte, necesidad de liquidez).",
  MODERADO:
    "Riesgo: bajo-medio. Podrías ver caídas moderadas en periodos malos (por ejemplo, -5% a -10% en un año difícil), compensadas por crecimiento en los años buenos. Revisa esta propuesta al menos una vez al año.",
  EQUILIBRADO:
    "Riesgo: medio. En un año de mercado bajista podrías ver caídas de en torno al -10% a -15%; en años favorables, el crecimiento debería ser notablemente mayor que en un perfil conservador. Revisa tu tolerancia al riesgo si una caída así te generaría mucha incomodidad.",
  DINAMICO:
    "Riesgo: medio-alto. En caídas de mercado fuertes podrías ver descensos de -15% a -25% en un año malo. A cambio, el potencial de crecimiento a largo plazo es mayor. Solo recomendable con horizonte largo (normalmente 8+ años).",
  AGRESIVO:
    "Riesgo: alto. Esta cartera puede caer con fuerza en años malos (-25% o más es posible), aunque históricamente los mercados de renta variable se han recuperado a largo plazo. Solo adecuado si tu horizonte es largo y tu tolerancia a la volatilidad es alta de verdad, no solo en teoría.",
};

export function calculateInvestmentAllocation(input: {
  availableCapital: number;
  riskCategory: RiskCategory;
}): InvestmentAllocationResult {
  const { availableCapital, riskCategory } = input;

  if (availableCapital < 0) {
    throw new Error("El capital disponible no puede ser negativo.");
  }

  const basePcts = BASE_ALLOCATION_BY_RISK[riskCategory];

  const allocations: AllocationLine[] = (Object.keys(basePcts) as AssetBucket[])
    .map((bucket) => ({
      bucket,
      label: BUCKET_LABELS[bucket],
      pct: basePcts[bucket],
      amount: round2((basePcts[bucket] / 100) * availableCapital),
    }))
    .filter((line) => line.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  return {
    availableCapital: round2(availableCapital),
    riskCategory,
    allocations,
    rationale: RATIONALE_BY_RISK[riskCategory],
    riskWarning: RISK_WARNING_BY_RISK[riskCategory],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
