"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { calculatePortfolioSummary } from "@/lib/finance-engine/portfolio";
import { INVESTMENT_CATEGORIES } from "@/lib/constants/investment-options";
import { INVESTMENT_CATEGORY_ICONS } from "@/lib/money/categories";
import { saveRecord } from "@/lib/money/client";
import { PortfolioSummaryCards } from "./portfolio-summary-cards";
import { IconPicker } from "./icon-picker";

type Investment = {
  id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  category: string;
  icon: string | null;
  quantity: string;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  name: "",
  ticker: "",
  isin: "",
  category: "ETF",
  icon: null as string | null,
  quantity: "",
  purchasePrice: "",
  currentPrice: "",
  purchaseDate: today(),
});

const CATEGORY_COLORS: Record<string, string> = {
  ETF: "bg-wealth-500",
  STOCK: "bg-signal-amber",
  FUND: "bg-ink-600",
  BOND: "bg-mist-400",
  DEPOSIT: "bg-mist-300",
  CRYPTO: "bg-signal-red",
  OTHER: "bg-ink-700",
};

// En pantallas táctiles los botones se ven siempre; en escritorio, con hover o foco
const ACTION =
  "h-8 w-8 flex items-center justify-center rounded-md text-mist-400 transition-all hover:bg-mist-100 dark:hover:bg-ink-800 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100";

function normalize(inv: any): Investment {
  return {
    ...inv,
    quantity: String(inv.quantity),
    purchasePrice: String(inv.purchasePrice),
    currentPrice: String(inv.currentPrice),
    purchaseDate: new Date(inv.purchaseDate).toISOString(),
  };
}

export function InvestmentsManager({ initialInvestments }: { initialInvestments: Investment[] }) {
  const [investments, setInvestments] = useState(initialInvestments);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialInvestments.length === 0);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

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

  // El motor de cartera no conoce el icono: lo buscamos por id
  const byId = useMemo(() => new Map(investments.map((i) => [i.id, i])), [investments]);

  function startEdit(inv: Investment) {
    setEditingId(inv.id);
    setForm({
      name: inv.name,
      ticker: inv.ticker ?? "",
      isin: inv.isin ?? "",
      category: inv.category,
      icon: inv.icon,
      quantity: String(Number(inv.quantity)),
      purchasePrice: String(Number(inv.purchasePrice)),
      currentPrice: String(Number(inv.currentPrice)),
      purchaseDate: inv.purchaseDate.slice(0, 10),
    });
    setError(null);
    setShowForm(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function closeForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(false);
  }

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
    if (!form.purchaseDate) return setError("Introduce la fecha de compra.");

    setSubmitting(true);
    const result = await saveRecord<Investment>(
      "investments",
      {
        name: form.name,
        ticker: form.ticker.trim() || null,
        isin: form.isin.trim() || null,
        category: form.category,
        icon: form.icon,
        quantity,
        purchasePrice,
        currentPrice,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
      },
      editingId,
      "No se pudo guardar la inversión.",
    );
    setSubmitting(false);
    if (!result.ok) return setError(result.error);

    const saved = normalize(result.data);
    setInvestments(editingId ? investments.map((i) => (i.id === editingId ? saved : i)) : [saved, ...investments]);
    closeForm();
    router.refresh(); // el Dashboard y las alertas de cartera leen estos datos
  }

  async function handleDelete(inv: { id: string; name: string }) {
    if (!window.confirm(`¿Eliminar "${inv.name}" de tu cartera?`)) return;
    const previous = investments;
    setInvestments(investments.filter((i) => i.id !== inv.id));
    if (editingId === inv.id) closeForm();
    const res = await fetch(`/api/investments/${inv.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setInvestments(previous);
      window.alert("No se pudo eliminar la inversión. Inténtalo de nuevo.");
    } else {
      router.refresh();
    }
  }

  const categoryLabel = (c: string) => INVESTMENT_CATEGORIES.find((x) => x.value === c)?.label ?? c;

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
                title={`${categoryLabel(category)}: ${pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(summary.weightByCategory).map(([category, pct]) => (
              <div key={category} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category] ?? "bg-mist-400"}`} />
                <span className="text-ink-600 dark:text-mist-400">{categoryLabel(category)}</span>
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
        <button onClick={() => (showForm ? closeForm() : setShowForm(true))} className="btn-primary">
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-base`} aria-hidden="true" />
          {showForm ? "Cancelar" : "Añadir inversión"}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="card p-5 space-y-4 scroll-mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{editingId ? "Editar inversión" : "Nueva inversión"}</p>
            {editingId && <span className="eyebrow text-[10px] text-wealth-500">Editando</span>}
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="inv-name">Nombre</label>
              <div className="flex gap-2">
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => setForm({ ...form, icon })}
                  fallbackIcon={INVESTMENT_CATEGORY_ICONS[form.category] ?? "💼"}
                />
                <input
                  id="inv-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ETF MSCI World"
                  className="field-input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="inv-category">Categoría</label>
              <select
                id="inv-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="field-input"
              >
                {INVESTMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {INVESTMENT_CATEGORY_ICONS[c.value] ?? ""} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="inv-ticker">Ticker (opcional)</label>
              <input
                id="inv-ticker"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                placeholder="VWCE"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="inv-isin">ISIN (opcional)</label>
              <input
                id="inv-isin"
                value={form.isin}
                onChange={(e) => setForm({ ...form, isin: e.target.value })}
                placeholder="IE00BK5BQT80"
                className="field-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="field-label" htmlFor="inv-qty">Cantidad</label>
              <input
                id="inv-qty"
                type="number"
                step="0.000001"
                inputMode="decimal"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="10"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="inv-buy">Precio compra (€)</label>
              <input
                id="inv-buy"
                type="number"
                step="0.0001"
                inputMode="decimal"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="95.50"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="inv-now">Precio actual (€)</label>
              <input
                id="inv-now"
                type="number"
                step="0.0001"
                inputMode="decimal"
                value={form.currentPrice}
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                placeholder="102.30"
                className={clsx("field-input", editingId && "ring-1 ring-wealth-400")}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="inv-date">Fecha de compra</label>
              <input
                id="inv-date"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="field-input"
              />
            </div>
          </div>

          {error && <p className="text-xs text-signal-red">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn-accent">
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir inversión"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={closeForm}
                className="px-4 text-sm text-ink-600 dark:text-mist-400 hover:text-ink-900 dark:hover:text-mist-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {summary.investments.length === 0 && !showForm ? (
        <div className="border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
          <p className="font-medium mb-1">Todavía no tienes inversiones</p>
          <p className="text-sm text-ink-600 dark:text-mist-400">Añade una para ver tu cartera aquí.</p>
        </div>
      ) : summary.investments.length > 0 ? (
        <div className="card divide-y divide-mist-100 dark:divide-ink-700">
          {summary.investments.map((inv) => {
            const original = byId.get(inv.id);
            const icon = original?.icon || INVESTMENT_CATEGORY_ICONS[inv.category] || "💼";
            const isEditing = editingId === inv.id;
            return (
              <div
                key={inv.id}
                className={clsx(
                  "group flex items-center justify-between gap-3 p-4 transition-colors",
                  isEditing && "bg-wealth-100/70 dark:bg-wealth-500/10",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-mist-100 dark:bg-ink-800 text-lg"
                  >
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.name}</p>
                    <p className="text-xs text-ink-600 dark:text-mist-400 mt-0.5 flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_COLORS[inv.category] ?? "bg-mist-400"}`} />
                      {categoryLabel(inv.category)} · {inv.quantity} uds · peso {inv.weightPct}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-1">
                    <p className="mono-data text-sm font-medium">{formatEUR(inv.currentValue)}</p>
                    <p className={`mono-data text-xs ${inv.gainLoss >= 0 ? "text-wealth-500" : "text-signal-red"}`}>
                      {inv.gainLoss >= 0 ? "+" : ""}
                      {inv.gainLossPct}%
                    </p>
                  </div>
                  <button
                    onClick={() => original && startEdit(original)}
                    aria-label={`Editar ${inv.name}`}
                    className={clsx(ACTION, "hover:text-wealth-500", isEditing && "!opacity-100 text-wealth-500")}
                  >
                    <i className="ti ti-pencil text-base" aria-hidden="true" />
                  </button>
                  <button onClick={() => handleDelete(inv)} aria-label={`Eliminar ${inv.name}`} className={clsx(ACTION, "hover:text-signal-red")}>
                    <i className="ti ti-trash text-base" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
