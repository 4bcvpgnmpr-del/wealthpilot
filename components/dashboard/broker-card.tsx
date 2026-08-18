"use client";

import { useState } from "react";

const BROKER_META: Record<string, { name: string; description: string; icon: string }> = {
  INTERACTIVE_BROKERS: {
    name: "Interactive Brokers",
    description: "Broker internacional con acceso a mercados globales.",
    icon: "ti-world",
  },
  TRADE_REPUBLIC: {
    name: "Trade Republic",
    description: "Broker europeo especializado en ETFs y acciones.",
    icon: "ti-building-bank",
  },
  DEGIRO: {
    name: "DEGIRO",
    description: "Broker europeo con comisiones reducidas.",
    icon: "ti-chart-candle",
  },
  ETORO: {
    name: "eToro",
    description: "Plataforma social de inversión y trading.",
    icon: "ti-users",
  },
};

export function BrokerCard({ provider }: { provider: string }) {
  const [showNotice, setShowNotice] = useState(false);
  const meta = BROKER_META[provider];
  if (!meta) return null;

  return (
    <div className="card p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-mist-100 dark:bg-ink-800 flex items-center justify-center shrink-0">
          <i className={`ti ${meta.icon} text-lg text-ink-600 dark:text-mist-400`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{meta.name}</p>
          <p className="text-xs text-ink-600 dark:text-mist-400 truncate">{meta.description}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="eyebrow px-2 py-0.5 rounded-full bg-mist-200/70 dark:bg-ink-700 text-ink-600 dark:text-mist-400">
          Integración pendiente
        </span>
        <button
          onClick={() => setShowNotice(true)}
          className="text-xs text-ink-600 dark:text-mist-400 hover:text-ink-900 dark:hover:text-mist-100 transition-colors"
        >
          Conectar
        </button>
      </div>

      {showNotice && (
        <div
          className="fixed inset-0 bg-ink-950/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotice(false)}
        >
          <div className="card p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium text-sm mb-2">Integración pendiente</p>
            <p className="text-sm text-ink-600 dark:text-mist-400 mb-4 leading-relaxed">
              La conexión con {meta.name} todavía no está disponible. La arquitectura ya está preparada
              (adapters, tokenización, sin credenciales en texto plano) para añadirla en una fase futura
              sin afectar al resto de la aplicación.
            </p>
            <button onClick={() => setShowNotice(false)} className="btn-secondary w-full">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
