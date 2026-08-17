"use client";

import { useState } from "react";
import { GOAL_TYPES, GOAL_PRIORITIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants/goal-options";
import { GoalCard } from "./goal-card";

type Goal = {
  id: string;
  name: string;
  type: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  monthlyContribution: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  riskTolerance: string | null;
};

const emptyForm = {
  name: "",
  type: "EMERGENCY_FUND",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  monthlyContribution: "",
  priority: "MEDIUM",
  riskTolerance: "",
};

export function GoalsManager({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialGoals.length === 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const targetAmount = Number(form.targetAmount);
    const currentAmount = Number(form.currentAmount || 0);
    const monthlyContribution = Number(form.monthlyContribution || 0);

    if (!form.name.trim()) return setError("Ponle un nombre a este objetivo.");
    if (!targetAmount || targetAmount <= 0) return setError("Introduce una cantidad objetivo mayor que 0.");

    setSubmitting(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        targetAmount,
        currentAmount,
        monthlyContribution,
        priority: form.priority,
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
        riskTolerance: form.riskTolerance || null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo guardar el objetivo.");
      return;
    }

    const created = await res.json();
    setGoals([created, ...goals]);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    setGoals(goals.filter((g) => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-600 dark:text-mist-400">
          {goals.length} {goals.length === 1 ? "objetivo" : "objetivos"}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-card bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 text-sm font-medium"
        >
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-base`} aria-hidden="true" />
          {showForm ? "Cancelar" : "Nuevo objetivo"}
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
                placeholder="Fondo de emergencia"
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
                {GOAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Cantidad objetivo (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="6000"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Cantidad actual (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                placeholder="0"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Aportación mensual (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.monthlyContribution}
                onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
                placeholder="150"
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Fecha objetivo</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              >
                {GOAL_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Riesgo permitido</label>
              <select
                value={form.riskTolerance}
                onChange={(e) => setForm({ ...form, riskTolerance: e.target.value })}
                className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              >
                <option value="">Sin especificar</option>
                {RISK_TOLERANCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-signal-red">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-wealth-500 text-white rounded-card px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Crear objetivo"}
          </button>
        </form>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-ink-900 border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
          <p className="font-medium mb-1">Todavía no tienes objetivos</p>
          <p className="text-sm text-ink-600 dark:text-mist-400">
            Crea uno para hacer seguimiento de tu progreso.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onDelete={() => handleDelete(g.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
