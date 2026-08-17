"use client";

import { useState } from "react";
import { LIABILITY_TYPES } from "@/lib/constants/money-categories";
import { MoneyRow } from "./money-row";

type Liability = {
  id: string;
  label: string;
  type: string;
  outstanding: string;
  interestRate: string;
  monthlyPayment: string;
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export function LiabilitiesTab({ initialLiabilities }: { initialLiabilities: Liability[] }) {
  const [liabilities, setLiabilities] = useState(initialLiabilities);
  const [form, setForm] = useState({
    label: "",
    type: "prestamo_personal",
    outstanding: "",
    interestRate: "",
    monthlyPayment: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const outstanding = Number(form.outstanding);
    const interestRate = Number(form.interestRate);
    const monthlyPayment = Number(form.monthlyPayment);

    if (!form.label.trim()) return setError("Ponle un nombre a esta deuda.");
    if (form.outstanding === "" || outstanding < 0) return setError("Introduce el importe pendiente.");
    if (form.monthlyPayment === "" || monthlyPayment < 0) return setError("Introduce la cuota mensual.");

    setSubmitting(true);
    const res = await fetch("/api/liabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, outstanding, interestRate: interestRate || 0, monthlyPayment }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo guardar la deuda.");
      return;
    }

    const created = await res.json();
    setLiabilities([created, ...liabilities]);
    setForm({ label: "", type: "prestamo_personal", outstanding: "", interestRate: "", monthlyPayment: "" });
  }

  async function handleDelete(id: string) {
    setLiabilities(liabilities.filter((l) => l.id !== id));
    await fetch(`/api/liabilities/${id}`, { method: "DELETE" });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5 space-y-3 h-fit">
        <p className="font-medium text-sm mb-1">Añadir deuda</p>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Nombre</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Préstamo coche"
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          >
            {LIABILITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Pendiente (€)</label>
            <input
              type="number"
              step="0.01"
              value={form.outstanding}
              onChange={(e) => setForm({ ...form, outstanding: e.target.value })}
              placeholder="8000"
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Interés (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
              placeholder="5.5"
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Cuota mensual (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.monthlyPayment}
            onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
            placeholder="200"
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Añadir deuda"}
        </button>
      </form>

      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
        <p className="font-medium text-sm mb-2">Tus deudas</p>
        {liabilities.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-6 text-center">
            Todavía no has añadido ninguna deuda.
          </p>
        ) : (
          liabilities.map((l) => (
            <MoneyRow
              key={l.id}
              label={l.label}
              meta={`${LIABILITY_TYPES.find((t) => t.value === l.type)?.label ?? l.type} · cuota ${formatEUR(Number(l.monthlyPayment))}/mes`}
              amount={formatEUR(Number(l.outstanding))}
              amountTone="negative"
              onDelete={() => handleDelete(l.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
