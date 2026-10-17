"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GOAL_TYPES, GOAL_PRIORITIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants/goal-options";
import { GOAL_TYPE_ICONS } from "@/lib/money/categories";
import { saveRecord } from "@/lib/money/client";
import { GoalCard } from "./goal-card";
import { IconPicker } from "./icon-picker";

type Goal = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
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
  icon: null as string | null,
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  monthlyContribution: "",
  priority: "MEDIUM",
  riskTolerance: "",
};

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// Los Decimal y fechas llegan de la API como string/number: los normalizamos al
// mismo formato que serializa la página en el servidor.
function normalize(g: any): Goal {
  return {
    ...g,
    targetAmount: String(g.targetAmount),
    currentAmount: String(g.currentAmount),
    monthlyContribution: String(g.monthlyContribution),
    targetDate: g.targetDate ? new Date(g.targetDate).toISOString() : null,
  };
}

export function GoalsManager({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialGoals.length === 0);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function startEdit(g: Goal) {
    setEditingId(g.id);
    setForm({
      name: g.name,
      type: g.type,
      icon: g.icon,
      targetAmount: String(Number(g.targetAmount)),
      currentAmount: String(Number(g.currentAmount)),
      targetDate: g.targetDate ? g.targetDate.slice(0, 10) : "",
      monthlyContribution: String(Number(g.monthlyContribution)),
      priority: g.priority,
      riskTolerance: g.riskTolerance ?? "",
    });
    setError(null);
    setShowForm(true);
    // esperar a que el formulario se pinte antes de desplazarse
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function closeForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const targetAmount = Number(form.targetAmount);
    const currentAmount = Number(form.currentAmount || 0);
    const monthlyContribution = Number(form.monthlyContribution || 0);

    if (!form.name.trim()) return setError("Ponle un nombre a este objetivo.");
    if (!targetAmount || targetAmount <= 0) return setError("Introduce una cantidad objetivo mayor que 0.");
    if (currentAmount < 0) return setError("La cantidad actual no puede ser negativa.");

    setSubmitting(true);
    const result = await saveRecord<Goal>(
      "goals",
      {
        name: form.name,
        type: form.type,
        icon: form.icon,
        targetAmount,
        currentAmount,
        monthlyContribution,
        priority: form.priority,
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
        riskTolerance: form.riskTolerance || null,
      },
      editingId,
      "No se pudo guardar el objetivo.",
    );
    setSubmitting(false);
    if (!result.ok) return setError(result.error);

    const saved = normalize(result.data);
    const next = editingId ? goals.map((g) => (g.id === editingId ? saved : g)) : [saved, ...goals];
    // misma ordenación que el servidor: prioridad alta primero
    setGoals([...next].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
    closeForm();
    router.refresh(); // el Dashboard y las alertas leen estos datos
  }

  async function handleDelete(goal: Goal) {
    if (!window.confirm(`¿Eliminar el objetivo "${goal.name}"?`)) return;
    const previous = goals;
    setGoals(goals.filter((g) => g.id !== goal.id));
    if (editingId === goal.id) closeForm();
    const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setGoals(previous);
      window.alert("No se pudo eliminar el objetivo. Inténtalo de nuevo.");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-600 dark:text-mist-400">
          {goals.length} {goals.length === 1 ? "objetivo" : "objetivos"}
        </p>
        <button onClick={() => (showForm ? closeForm() : setShowForm(true))} className="btn-primary">
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-base`} aria-hidden="true" />
          {showForm ? "Cancelar" : "Nuevo objetivo"}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="card p-5 space-y-4 scroll-mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{editingId ? "Editar objetivo" : "Nuevo objetivo"}</p>
            {editingId && <span className="eyebrow text-[10px] text-wealth-500">Editando</span>}
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="goal-name">Nombre</label>
              <div className="flex gap-2">
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => setForm({ ...form, icon })}
                  fallbackIcon={GOAL_TYPE_ICONS[form.type] ?? "🎯"}
                />
                <input
                  id="goal-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Fondo de emergencia"
                  className="field-input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="goal-type">Tipo</label>
              <select
                id="goal-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="field-input"
              >
                {GOAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {GOAL_TYPE_ICONS[t.value] ?? ""} {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <div>
              <label className="field-label" htmlFor="goal-target">Cantidad objetivo (€)</label>
              <input
                id="goal-target"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="6000"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="goal-current">Cantidad actual (€)</label>
              <input
                id="goal-current"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                placeholder="0"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="goal-monthly">Aportación mensual (€)</label>
              <input
                id="goal-monthly"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.monthlyContribution}
                onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
                placeholder="150"
                className="field-input"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <div>
              <label className="field-label" htmlFor="goal-date">Fecha objetivo</label>
              <input
                id="goal-date"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="goal-priority">Prioridad</label>
              <select
                id="goal-priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="field-input"
              >
                {GOAL_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="goal-risk">Riesgo permitido</label>
              <select
                id="goal-risk"
                value={form.riskTolerance}
                onChange={(e) => setForm({ ...form, riskTolerance: e.target.value })}
                className="field-input"
              >
                <option value="">Sin especificar</option>
                {RISK_TOLERANCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-signal-red">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn-accent">
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear objetivo"}
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

      {goals.length === 0 && !showForm ? (
        <div className="border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
          <p className="font-medium mb-1">Todavía no tienes objetivos</p>
          <p className="text-sm text-ink-600 dark:text-mist-400">Crea uno para hacer seguimiento de tu progreso.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              isEditing={editingId === g.id}
              onEdit={() => startEdit(g)}
              onDelete={() => handleDelete(g)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
