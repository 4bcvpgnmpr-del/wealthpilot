"use client";

import { useState } from "react";

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

const BUCKET_COLOR: Record<string, string> = {
  ETF_GLOBAL: "bg-wealth-500",
  US_STOCKS: "bg-signal-amber",
  BONDS: "bg-ink-600",
  CASH: "bg-mist-300",
};

const RISK_COLOR: Record<string, string> = {
  CONSERVADOR: "text-signal-red",
  MODERADO: "text-signal-amber",
  EQUILIBRADO: "text-ink-900 dark:text-mist-100",
  DINAMICO: "text-wealth-400",
  AGRESIVO: "text-wealth-500",
};

type Allocation = { bucket: string; label: string; pct: number; amount: number };
type Proposal = {
  flow: { availableToInvest: number };
  riskCategory: string;
  allocation: { availableCapital: number; allocations: Allocation[]; rationale: string; riskWarning: string };
};

export function InvestmentPlanView({
  initialProposal,
  initialError,
}: {
  initialProposal: Proposal | null;
  initialError: string | null;
}) {
  const [proposal, setProposal] = useState(initialProposal);
  const [error, setError] = useState(initialError);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate() {
    setSubmitting(true);
    const res = await fetch("/api/investment-plan", { method: "POST" });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo generar el plan.");
      return;
    }

    const data = await res.json();
    setProposal(data);
    setSaved(true);
  }

  if (error || !proposal) {
    return (
      <div className="border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
        <p className="font-medium mb-1">Todavía no podemos calcular tu plan</p>
        <p className="text-sm text-ink-600 dark:text-mist-400 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <a href="/mi-dinero" className="btn-secondary">Completar mis datos</a>
          <a href="/perfil-riesgo" className="btn-secondary">Hacer test de riesgo</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-7">
        <p className="eyebrow text-mist-400 mb-2">Capital disponible para invertir</p>
        <p className="figure text-4xl font-medium mb-1">{formatEUR(proposal.allocation.availableCapital)}</p>
        <p className="text-xs text-ink-600 dark:text-mist-400">
          Según tu perfil{" "}
          <span className={`font-medium ${RISK_COLOR[proposal.riskCategory]}`}>
            {proposal.riskCategory.charAt(0) + proposal.riskCategory.slice(1).toLowerCase()}
          </span>
        </p>
      </div>

      {/* Distribución propuesta */}
      <div className="card p-5">
        <p className="text-sm font-medium mb-4">Propuesta orientativa de distribución</p>
        <div className="h-3 rounded-full overflow-hidden flex mb-5">
          {proposal.allocation.allocations.map((a) => (
            <div key={a.bucket} className={BUCKET_COLOR[a.bucket]} style={{ width: `${a.pct}%` }} title={`${a.label}: ${a.pct}%`} />
          ))}
        </div>
        <div className="space-y-3">
          {proposal.allocation.allocations.map((a) => (
            <div key={a.bucket} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${BUCKET_COLOR[a.bucket]}`} />
                <span className="text-sm">{a.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="mono-data text-xs text-ink-600 dark:text-mist-400">{a.pct}%</span>
                <span className="mono-data text-sm font-medium w-20 text-right">{formatEUR(a.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por qué y qué riesgo tiene — exigido por spec sección 20 */}
      <div className="card p-5">
        <p className="text-sm font-medium mb-2">¿Por qué esta distribución?</p>
        <p className="text-sm text-ink-600 dark:text-mist-400 leading-relaxed">{proposal.allocation.rationale}</p>
      </div>

      <div className="card p-5 border-l-2 !border-l-signal-amber">
        <p className="text-sm font-medium mb-2 flex items-center gap-2">
          <i className="ti ti-alert-triangle text-signal-amber" aria-hidden="true" />
          Qué riesgo tiene
        </p>
        <p className="text-sm text-ink-600 dark:text-mist-400 leading-relaxed">{proposal.allocation.riskWarning}</p>
      </div>

      <div className="rounded-card p-5 bg-mist-200/50 dark:bg-ink-800 text-xs text-ink-600 dark:text-mist-400 leading-relaxed">
        <strong className="text-ink-900 dark:text-mist-100">Propuesta orientativa basada en los datos introducidos.</strong>{" "}
        No es una orden de inversión ni una garantía de rentabilidad. Antes de invertir, revisa si tu situación
        (ingresos, gastos, horizonte temporal, necesidad de liquidez) ha cambiado desde tu última respuesta al
        cuestionario de perfil de riesgo.
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleGenerate} disabled={submitting} className="btn-primary">
          {submitting ? "Generando..." : saved ? "Volver a generar" : "Guardar este plan"}
        </button>
        {saved && (
          <span className="text-xs text-wealth-500 flex items-center gap-1">
            <i className="ti ti-check" aria-hidden="true" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
