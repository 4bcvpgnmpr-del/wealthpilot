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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="card p-5">
        <p className="eyebrow text-mist-400 mb-2">Valor actual</p>
        <p className="figure text-[26px] leading-none font-medium">{formatEUR(totalCurrentValue)}</p>
      </div>
      <div className="card p-5">
        <p className="eyebrow text-mist-400 mb-2">Aportado</p>
        <p className="figure text-[26px] leading-none font-medium">{formatEUR(totalCostBasis)}</p>
      </div>
      <div className="card p-5">
        <p className="eyebrow text-mist-400 mb-2">Rentabilidad</p>
        <p className={`figure text-[26px] leading-none font-medium ${positive ? "text-wealth-500" : "text-signal-red"}`}>
          {positive ? "+" : ""}
          {formatEUR(totalGainLoss)}
        </p>
      </div>
      <div className="card p-5">
        <p className="eyebrow text-mist-400 mb-2">Rentabilidad %</p>
        <p className={`figure text-[26px] leading-none font-medium ${positive ? "text-wealth-500" : "text-signal-red"}`}>
          {positive ? "+" : ""}
          {totalGainLossPct.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
