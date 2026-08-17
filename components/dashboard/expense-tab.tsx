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

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5 space-y-3 h-fit">
        <p className="font-medium text-sm mb-1">Añadir gasto</p>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Nombre</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Alquiler"
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            >
              <option value="FIXED">Fijo</option>
              <option value="VARIABLE">Variable</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Recurrencia</label>
            <select
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            >
              {RECURRENCE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Importe (€)</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="750"
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Añadir gasto"}
        </button>
      </form>

      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
        <p className="font-medium text-sm mb-2">Tus gastos</p>
        {expenses.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-6 text-center">
            Todavía no has añadido ningún gasto.
          </p>
        ) : (
          expenses.map((e) => (
            <MoneyRow
              key={e.id}
              label={e.label}
              meta={`${EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category} · ${TYPE_LABEL[e.type]} · ${RECURRENCE_LABEL[e.recurrence]}`}
              amount={formatEUR(Number(e.amount))}
              amountTone="negative"
              onDelete={() => handleDelete(e.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
