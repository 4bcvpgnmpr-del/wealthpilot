/**
 * Sistema de puntuación del perfil de riesgo.
 *
 * Documentado y configurable, tal como exige el spec (sección 7):
 * no es una puntuación arbitraria — cada pregunta tiene un peso explícito
 * y las respuestas están tipadas, para que el criterio de asignación de
 * perfil sea auditable y ajustable sin tocar el resto del sistema.
 */

export type RiskCategory = "CONSERVADOR" | "MODERADO" | "EQUILIBRADO" | "DINAMICO" | "AGRESIVO";

export interface RiskQuestionnaireAnswers {
  age: number;
  investingExperience: "ninguna" | "basica" | "intermedia" | "avanzada";
  timeHorizonYears: number;
  lossReactionScenario: "vendo_todo" | "vendo_parte" | "no_hago_nada" | "compro_mas";
  liquidityNeed: "alta" | "media" | "baja";
  primaryGoal: "preservar_capital" | "crecimiento_moderado" | "crecimiento_alto";
}

interface WeightedQuestion {
  key: keyof RiskQuestionnaireAnswers;
  weight: number;
  score: (answers: RiskQuestionnaireAnswers) => number; // 0-100
}

// Cada pregunta puntúa 0-100 y luego se pondera. Los pesos suman 1.0.
export const RISK_SCORING_MODEL: WeightedQuestion[] = [
  {
    key: "age",
    weight: 0.15,
    score: (a) => {
      // más joven -> más margen para asumir riesgo
      if (a.age < 30) return 100;
      if (a.age < 40) return 80;
      if (a.age < 50) return 60;
      if (a.age < 60) return 40;
      return 20;
    },
  },
  {
    key: "investingExperience",
    weight: 0.15,
    score: (a) =>
      ({ ninguna: 10, basica: 40, intermedia: 70, avanzada: 100 }[a.investingExperience]),
  },
  {
    key: "timeHorizonYears",
    weight: 0.25,
    score: (a) => {
      if (a.timeHorizonYears >= 15) return 100;
      if (a.timeHorizonYears >= 10) return 80;
      if (a.timeHorizonYears >= 5) return 55;
      if (a.timeHorizonYears >= 2) return 30;
      return 10;
    },
  },
  {
    key: "lossReactionScenario",
    weight: 0.25,
    score: (a) =>
      ({
        vendo_todo: 5,
        vendo_parte: 35,
        no_hago_nada: 65,
        compro_mas: 100,
      }[a.lossReactionScenario]),
  },
  {
    key: "liquidityNeed",
    weight: 0.1,
    score: (a) => ({ alta: 10, media: 50, baja: 100 }[a.liquidityNeed]),
  },
  {
    key: "primaryGoal",
    weight: 0.1,
    score: (a) =>
      ({
        preservar_capital: 10,
        crecimiento_moderado: 55,
        crecimiento_alto: 100,
      }[a.primaryGoal]),
  },
];

export interface RiskScoreResult {
  score: number; // 0-100
  category: RiskCategory;
  explanation: string;
  breakdown: { key: string; rawScore: number; weight: number; weightedContribution: number }[];
}

// Umbrales de categoría — ajustables sin tocar la lógica de cálculo
const CATEGORY_THRESHOLDS: { max: number; category: RiskCategory }[] = [
  { max: 20, category: "CONSERVADOR" },
  { max: 40, category: "MODERADO" },
  { max: 60, category: "EQUILIBRADO" },
  { max: 80, category: "DINAMICO" },
  { max: 100, category: "AGRESIVO" },
];

const CATEGORY_EXPLANATIONS: Record<RiskCategory, string> = {
  CONSERVADOR:
    "Priorizas preservar tu capital sobre maximizar rentabilidad. Tu horizonte, experiencia o necesidad de liquidez sugieren evitar caídas fuertes de valor.",
  MODERADO:
    "Aceptas cierta volatilidad a cambio de algo más de crecimiento, pero mantienes preferencia por la estabilidad.",
  EQUILIBRADO:
    "Buscas un equilibrio entre crecimiento y seguridad, sin inclinarte claramente hacia ningún extremo.",
  DINAMICO:
    "Tu horizonte temporal y tolerancia a las caídas te permiten asumir más riesgo en busca de mayor crecimiento.",
  AGRESIVO:
    "Tu perfil (horizonte largo, experiencia, reacción ante caídas) indica alta tolerancia al riesgo en busca de máximo crecimiento a largo plazo.",
};

export function calculateRiskProfile(answers: RiskQuestionnaireAnswers): RiskScoreResult {
  const breakdown = RISK_SCORING_MODEL.map((q) => {
    const rawScore = q.score(answers);
    return {
      key: q.key,
      rawScore,
      weight: q.weight,
      weightedContribution: rawScore * q.weight,
    };
  });

  const score = Math.round(breakdown.reduce((sum, b) => sum + b.weightedContribution, 0));
  const category = CATEGORY_THRESHOLDS.find((t) => score <= t.max)!.category;

  return {
    score,
    category,
    explanation: CATEGORY_EXPLANATIONS[category],
    breakdown,
  };
}
