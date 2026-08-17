"use client";

import { useState } from "react";
import { INCOME_CATEGORIES, RECURRENCE_OPTIONS } from "@/lib/constants/money-categories";
import { MoneyRow } from "./money-row";

type Income = {
  id: string;
  label: string;
  category: string;
  amount: string; // Decimal viene serializado como string desde la API
  recurrence: "ONE_TIME" | "MONTHLY" | "ANNUAL";
};

const RECURRENCE_LABEL: Record<string, string> = {
  MONTHLY: "Mensual",
  ANNUAL: "Anual",
  ONE_TIME: "Puntual",
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export function IncomeTab({ initialIncomes }: { initialIncomes: Income[] }) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [form, setForm] = useState({ label: "", category: "salario", amount: "", recurrence: "MONTHLY" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.label.trim()) return setError("Ponle un nombre a este ingreso.");
    if (!amount || amount <= 0) return setError("Introduce un importe mayor que 0.");

    setSubmitting(true);
    const res = await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo guardar el ingreso.");
      return;
    }

    const created = await res.json();
    setIncomes([created, ...incomes]);
    setForm({ label: "", category: "salario", amount: "", recurrence: "MONTHLY" });
  }

  async function handleDelete(id: string) {
    setIncomes(incomes.filter((i) => i.id !== id));
    await fetch(`/api/income/${id}`, { method: "DELETE" });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5 space-y-3 h-fit">
        <p className="font-medium text-sm mb-1">Añadir ingreso</p>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Nombre</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Nómina mensual"
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
              {INCOME_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
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
        </div>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Importe (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="1800"
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Añadir ingreso"}
        </button>
      </form>

      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
        <p className="font-medium text-sm mb-2">Tus ingresos</p>
        {incomes.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-6 text-center">
            Todavía no has añadido ningún ingreso.
          </p>
        ) : (
          incomes.map((i) => (
            <MoneyRow
              key={i.id}
              label={i.label}
              meta={`${INCOME_CATEGORIES.find((c) => c.value === i.category)?.label ?? i.category} · ${RECURRENCE_LABEL[i.recurrence]}`}
              amount={formatEUR(Number(i.amount))}
              onDelete={() => handleDelete(i.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
