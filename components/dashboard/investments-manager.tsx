"use client";

import { useState, useMemo } from "react";
import { calculatePortfolioSummary } from "@/lib/finance-engine/portfolio";
import { INVESTMENT_CATEGORIES } from "@/lib/constants/investment-options";
import { PortfolioSummaryCards } from "./portfolio-summary-cards";

type Investment = {
  id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  category: string;
  quantity: string;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

const emptyForm = {
  name: "",
  ticker: "",
  isin: "",
  category: "ETF",
  quantity: "",
  purchasePrice: "",
  currentPrice: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
};

const CATEGORY_COLORS: Record<string, string> = {
  ETF: "bg-wealth-500",
  STOCK: "bg-signal-amber",
  FUND: "bg-ink-600",
  BOND: "bg-mist-400",
  DEPOSIT: "bg-mist-300",
  CRYPTO: "bg-signal-red",
  OTHER: "bg-ink-700",
};

export function InvestmentsManager({ initialInvestments }: { initialInvestments: Investment[] }) {
  const [investments, setInvestments] = useState(initialInvestments);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialInvestments.length === 0);

  const summary = useMemo(
    () =>
      calculatePortfolioSummary(
        investments.map((inv) => ({
          id: inv.id,
          name: inv.name,
          category: inv.category,
          quantity: Number(inv.quantity),
          purchasePrice: Number(inv.purchasePrice),
          currentPrice: Number(inv.currentPrice),
        }))
      ),
    [investments]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const quantity = Number(form.quantity);
    const purchasePrice = Number(form.purchasePrice);
    const currentPrice = Number(form.currentPrice);

    if (!form.name.trim()) return setError("Ponle un nombre a esta inversión.");
    if (!quantity || quantity <= 0) return setError("Introduce una cantidad mayor que 0.");
    if (form.purchasePrice === "" || purchasePrice < 0) return setError("Introduce el precio de compra.");
    if (form.currentPrice === "" || currentPrice < 0) return setError("Introduce el precio actual.");

    setSubmitting(true);
    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        ticker: form.ticker || null,
        isin: form.isin || null,
        category: form.category,
        quantity,
        purchasePrice,
        currentPrice,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo guardar la inversión.");
      return;
    }

    const created = await res.json();
    setInvestments([created, ...investments]);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    setInvestments(investments.filter((i) => i.id !== id));
    await fetch(`/api/investments/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <PortfolioSummaryCards
        totalCurrentValue={summary.totalCurrentValue}
        totalCostBasis={summary.totalCostBasis}
        totalGainLoss={summary.totalGainLoss}
        totalGainLossPct={summary.totalGainLossPct}
      />

      {Object.keys(summary.weightByCategory).length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-medium mb-4">Distribución por categoría</p>
          {/* Barra de composición única — más "terminal financiero" que barras separadas */}
          <div className="h-2.5 rounded-full overflow-hidden flex mb-4">
            {Object.entries(summary.weightByCategory).map(([category, pct]) => (
              <div
                key={category}
                className={CATEGORY_COLORS[category] ?? "bg-mist-400"}
                style={{ width: `${pct}%` }}
                title={`${category}: ${pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(summary.weightByCategory).map(([category, pct]) => (
              <div key={category} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category] ?? "bg-mist-400"}`} />
                <span className="text-ink-600 dark:text-mist-400">
                  {INVESTMENT_CATEGORIES.find((c) => c.value === category)?.label ?? category}
                </span>
                <span className="mono-data font-medium">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-600 dark:text-mist-400">
          {investments.length} {investments.length === 1 ? "posición" : "posiciones"}
        </p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-base`} aria-hidden="true" />
          {showForm ? "Cancelar" : "Añadir inversión"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ETF MSCI World"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="field-input"
              >
                {INVESTMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Ticker (opcional)</label>
              <input
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                placeholder="VWCE"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">ISIN (opcional)</label>
              <input
                value={form.isin}
                onChange={(e) => setForm({ ...form, isin: e.target.value })}
                placeholder="IE00BK5BQT80"
                className="field-input"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-3">
            <div>
              <label className="field-label">Cantidad</label>
              <input
                type="number"
                step="0.000001"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="10"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Precio compra (€)</label>
              <input
                type="number"
                step="0.0001"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="95.50"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Precio actual (€)</label>
              <input
                type="number"
                step="0.0001"
                value={form.currentPrice}
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                placeholder="102.30"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Fecha de compra</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="field-input"
              />
            </div>
          </div>

          {error && <p className="text-xs text-signal-red">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-accent">
            {submitting ? "Guardando..." : "Añadir inversión"}
          </button>
        </form>
      )}

      {summary.investments.length === 0 && !showForm ? (
        <div className="border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
          <p className="font-medium mb-1">Todavía no tienes inversiones</p>
          <p className="text-sm text-ink-600 dark:text-mist-400">Añade una para ver tu cartera aquí.</p>
        </div>
      ) : (
        <div className="card divide-y divide-mist-100 dark:divide-ink-700">
          {summary.investments.map((inv) => (
            <div key={inv.id} className="group flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[inv.category] ?? "bg-mist-400"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.name}</p>
                  <p className="text-xs text-ink-600 dark:text-mist-400 mt-0.5">
                    {INVESTMENT_CATEGORIES.find((c) => c.value === inv.category)?.label} · {inv.quantity} uds · peso {inv.weightPct}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="mono-data text-sm font-medium">{formatEUR(inv.currentValue)}</p>
                  <p className={`mono-data text-xs ${inv.gainLoss >= 0 ? "text-wealth-500" : "text-signal-red"}`}>
                    {inv.gainLoss >= 0 ? "+" : ""}
                    {inv.gainLossPct}%
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(inv.id)}
                  aria-label={`Eliminar ${inv.name}`}
                  className="text-mist-300 dark:text-ink-600 hover:text-signal-red transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <i className="ti ti-trash text-base" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
