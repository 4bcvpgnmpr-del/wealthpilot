"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, RECURRENCE_OPTIONS } from "@/lib/constants/money-categories";
import { MoneyRow } from "./money-row";

type Expense = {
  id: string;
  label: string;
  category: string;
  amount: string;
  type: "FIXED" | "VARIABLE";
  recurrence: "ONE_TIME" | "MONTHLY" | "ANNUAL";
};

const RECURRENCE_LABEL: Record<string, string> = { MONTHLY: "Mensual", ANNUAL: "Anual", ONE_TIME: "Puntual" };
const TYPE_LABEL: Record<string, string> = { FIXED: "Fijo", VARIABLE: "Variable" };

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export function ExpenseTab({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState({
    label: "",
    category: "vivienda",
    amount: "",
    type: "FIXED",
    recurrence: "MONTHLY",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.label.trim()) return setError("Ponle un nombre a este gasto.");
    if (!amount || amount <= 0) return setError("Introduce un importe mayor que 0.");

    setSubmitting(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo guardar el gasto.");
      return;
    }

    const created = await res.json();
    setExpenses([created, ...expenses]);
    setForm({ label: "", category: "vivienda", amount: "", type: "FIXED", recurrence: "MONTHLY" });
  }

  async function handleDelete(id: string) {
    setExpenses(expenses.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  }

  const totalMonthly = expenses.reduce((sum, e) => {
    const amt = Number(e.amount);
    if (e.recurrence === "MONTHLY") return sum + amt;
    if (e.recurrence === "ANNUAL") return sum + amt / 12;
    return sum;
  }, 0);

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-5">
      <form onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit">
        <p className="text-sm font-medium">Añadir gasto</p>
        <div>
          <label className="field-label">Nombre</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Alquiler"
            className="field-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="field-input"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="field-input"
            >
              <option value="FIXED">Fijo</option>
              <option value="VARIABLE">Variable</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Recurrencia</label>
            <select
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              className="field-input"
            >
              {RECURRENCE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Importe (€)</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="750"
              className="field-input"
            />
          </div>
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Guardando..." : "Añadir gasto"}
        </button>
      </form>

      <div className="card p-5">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-sm font-medium">Tus gastos</p>
          {expenses.length > 0 && (
            <p className="text-xs text-ink-600 dark:text-mist-400">
              <span className="mono-data text-signal-red font-medium">{formatEUR(totalMonthly)}</span> / mes
            </p>
          )}
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-10 text-center">
            Todavía no has añadido ningún gasto.
          </p>
        ) : (
          <div className="mt-2">
            {expenses.map((e) => (
              <MoneyRow
                key={e.id}
                label={e.label}
                meta={`${EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category} · ${TYPE_LABEL[e.type]} · ${RECURRENCE_LABEL[e.recurrence]}`}
                amount={formatEUR(Number(e.amount))}
                amountTone="negative"
                onDelete={() => handleDelete(e.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
