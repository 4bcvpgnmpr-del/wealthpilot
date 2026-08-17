"use client";

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export function PortfolioSummaryCards({
  totalCurrentValue,
  totalCostBasis,
  totalGainLoss,
  totalGainLossPct,
}: {
  totalCurrentValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPct: number;
}) {
  const positive = totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-4">
        <p className="text-xs text-ink-600 dark:text-mist-400 mb-1">Valor actual</p>
        <p className="figure text-2xl font-medium">{formatEUR(totalCurrentValue)}</p>
      </div>
      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-4">
        <p className="text-xs text-ink-600 dark:text-mist-400 mb-1">Aportado</p>
        <p className="figure text-2xl font-medium">{formatEUR(totalCostBasis)}</p>
      </div>
      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-4">
        <p className="text-xs text-ink-600 dark:text-mist-400 mb-1">Rentabilidad</p>
        <p className={`figure text-2xl font-medium ${positive ? "text-wealth-500" : "text-signal-red"}`}>
          {positive ? "+" : ""}
          {formatEUR(totalGainLoss)}
        </p>
      </div>
      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-4">
        <p className="text-xs text-ink-600 dark:text-mist-400 mb-1">Rentabilidad %</p>
        <p className={`figure text-2xl font-medium ${positive ? "text-wealth-500" : "text-signal-red"}`}>
          {positive ? "+" : ""}
          {totalGainLossPct.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
