/**
 * Cálculos de cartera de inversiones.
 * Igual que el resto del motor financiero: funciones puras, sin acceso a DB.
 */

export interface InvestmentInput {
  id: string;
  name: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

export interface InvestmentWithMetrics extends InvestmentInput {
  currentValue: number; // quantity * currentPrice
  costBasis: number; // quantity * purchasePrice
  gainLoss: number; // currentValue - costBasis
  gainLossPct: number; // gainLoss / costBasis * 100
  weightPct: number; // % del valor total de la cartera
}

export interface PortfolioSummary {
  totalCurrentValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  investments: InvestmentWithMetrics[];
  weightByCategory: Record<string, number>; // categoría -> % del total
}

export function calculatePortfolioSummary(investments: InvestmentInput[]): PortfolioSummary {
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
  const totalCostBasis = investments.reduce((sum, inv) => sum + inv.quantity * inv.purchasePrice, 0);

  const withMetrics: InvestmentWithMetrics[] = investments.map((inv) => {
    const currentValue = inv.quantity * inv.currentPrice;
    const costBasis = inv.quantity * inv.purchasePrice;
    const gainLoss = currentValue - costBasis;
    return {
      ...inv,
      currentValue: round2(currentValue),
      costBasis: round2(costBasis),
      gainLoss: round2(gainLoss),
      gainLossPct: costBasis > 0 ? round2((gainLoss / costBasis) * 100) : 0,
      weightPct: totalCurrentValue > 0 ? round2((currentValue / totalCurrentValue) * 100) : 0,
    };
  });

  const weightByCategory: Record<string, number> = {};
  for (const inv of withMetrics) {
    weightByCategory[inv.category] = (weightByCategory[inv.category] ?? 0) + inv.weightPct;
  }
  for (const key in weightByCategory) {
    weightByCategory[key] = round2(weightByCategory[key]);
  }

  const totalGainLoss = totalCurrentValue - totalCostBasis;

  return {
    totalCurrentValue: round2(totalCurrentValue),
    totalCostBasis: round2(totalCostBasis),
    totalGainLoss: round2(totalGainLoss),
    totalGainLossPct: totalCostBasis > 0 ? round2((totalGainLoss / totalCostBasis) * 100) : 0,
    investments: withMetrics,
    weightByCategory,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
