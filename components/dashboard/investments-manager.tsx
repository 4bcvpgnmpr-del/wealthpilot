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

export function InvestmentsManager({ initialInvestments }: { initialInvestments: Investment[] }) {
  const [investments, setInvestments] = useState(initialInvestments);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialInvestments.length === 0);

  // El motor de cálculo (rentabilidad, peso por categoría) es el mismo que
  // usamos en Fase 1, aplicado aquí a los datos reales de la cartera.
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
        <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
          <p className="font-medium text-sm mb-3">Distribución por categoría</p>
          <div className="space-y-2">
            {Object.entries(summary.weightByCategory).map(([category, pct]) => (
              <div key={category}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{INVESTMENT_CATEGORIES.find((c) => c.value === category)?.label ?? category}</span>
                  <span className="mono-data">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-mist-100 dark:bg-ink-700 overflow-hidden">
                  <div className="h-full bg-wealth-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-600 dark:text-mist-400">
          {investments.length} {investments.length === 1 ? "posición" : "posiciones"}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-card bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 text-sm font-medium"
        >
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-base`} aria-hidden="true" />
          {showForm ? "Cancelar" : "Añadir inversión"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5 space-y-3">
          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ETF MSCI World"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              >
                {INVESTMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Ticker (opcional)</label>
              <input
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                placeholder="VWCE"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">ISIN (opcional)</label>
              <input
                value={form.isin}
                onChange={(e) => setForm({ ...form, isin: e.target.value })}
                placeholder="IE00BK5BQT80"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Cantidad</label>
              <input
                type="number"
                step="0.000001"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="10"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Precio compra (€)</label>
              <input
                type="number"
                step="0.0001"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="95.50"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Precio actual (€)</label>
              <input
                type="number"
                step="0.0001"
                value={form.currentPrice}
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                placeholder="102.30"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Fecha de compra</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-xs text-signal-red">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-wealth-500 text-white rounded-card px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Añadir inversión"}
          </button>
        </form>
      )}

      {summary.investments.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-ink-900 border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
          <p className="font-medium mb-1">Todavía no tienes inversiones</p>
          <p className="text-sm text-ink-600 dark:text-mist-400">Añade una para ver tu cartera aquí.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card divide-y divide-mist-200 dark:divide-ink-700">
          {summary.investments.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{inv.name}</p>
                <p className="text-xs text-ink-600 dark:text-mist-400">
                  {INVESTMENT_CATEGORIES.find((c) => c.value === inv.category)?.label} · {inv.quantity} uds · peso {inv.weightPct}%
                </p>
              </div>
              <div className="flex items-center gap-4">
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
                  className="text-ink-600 dark:text-mist-400 hover:text-signal-red transition-colors"
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
