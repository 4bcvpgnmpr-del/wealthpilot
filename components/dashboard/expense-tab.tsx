"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RECURRENCE_OPTIONS } from "@/lib/constants/money-categories";
import { mergeCategories, resolveCategory } from "@/lib/money/categories";
import { formatEUR, RECURRENCE_LABEL, saveRecord, toMonthly } from "@/lib/money/client";
import { MoneyRow } from "./money-row";
import { IconPicker } from "./icon-picker";
import { CategoryPicker, type UserCategory } from "./category-picker";

type Expense = {
  id: string;
  label: string;
  category: string;
  icon: string | null;
  amount: string;
  type: "FIXED" | "VARIABLE";
  recurrence: "ONE_TIME" | "MONTHLY" | "ANNUAL";
};

const TYPE_LABEL: Record<string, string> = { FIXED: "Fijo", VARIABLE: "Variable" };
const EMPTY = { label: "", category: "vivienda", icon: null as string | null, amount: "", type: "FIXED", recurrence: "MONTHLY" };

export function ExpenseTab({
  initialExpenses,
  categories,
  onCategoriesChange,
}: {
  initialExpenses: Expense[];
  categories: UserCategory[];
  onCategoriesChange: (next: UserCategory[]) => void;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter(); // refresca las tarjetas de resumen (calculadas en el servidor)

  const options = mergeCategories("EXPENSE", categories);
  const categoryIcon = resolveCategory(options, form.category).icon;

  function startEdit(x: Expense) {
    setEditingId(x.id);
    setForm({ label: x.label, category: x.category, icon: x.icon, amount: String(Number(x.amount)), type: x.type, recurrence: x.recurrence });
    setError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.label.trim()) return setError("Ponle un nombre a este gasto.");
    if (!amount || amount <= 0) return setError("Introduce un importe mayor que 0.");

    setSubmitting(true);
    const result = await saveRecord<Expense>("expenses", { ...form, amount }, editingId, "No se pudo guardar el gasto.");
    setSubmitting(false);
    if (!result.ok) return setError(result.error);

    const saved = { ...result.data, amount: String(result.data.amount) };
    setExpenses(editingId ? expenses.map((x) => (x.id === editingId ? saved : x)) : [saved, ...expenses]);
    cancelEdit();
    router.refresh();
  }

  async function handleDelete(item: Expense) {
    if (!window.confirm(`¿Eliminar el gasto "${item.label}"?`)) return;
    const previous = expenses;
    setExpenses(expenses.filter((x) => x.id !== item.id));
    if (editingId === item.id) cancelEdit();
    const res = await fetch(`/api/expenses/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setExpenses(previous);
      setError("No se pudo eliminar el gasto.");
    } else {
      router.refresh();
    }
  }

  const totalMonthly = toMonthly(expenses);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <form ref={formRef} onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit scroll-mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{editingId ? "Editar gasto" : "Añadir gasto"}</p>
          {editingId && <span className="eyebrow text-[10px] text-wealth-500">Editando</span>}
        </div>
        <div>
          <label className="field-label" htmlFor="expense-label">Nombre</label>
          <div className="flex gap-2">
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} fallbackIcon={categoryIcon} />
            <input
              id="expense-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Alquiler"
              className="field-input flex-1"
            />
          </div>
        </div>
        <CategoryPicker
          kind="EXPENSE"
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="expense-type">Tipo</label>
            <select
              id="expense-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="field-input"
            >
              <option value="FIXED">Fijo</option>
              <option value="VARIABLE">Variable</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="expense-recurrence">Recurrencia</label>
            <select
              id="expense-recurrence"
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              className="field-input"
            >
              {RECURRENCE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="expense-amount">Importe (€)</label>
          <input
            id="expense-amount"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="750"
            className="field-input"
          />
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir gasto"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-4 text-sm text-ink-600 dark:text-mist-400 hover:text-ink-900 dark:hover:text-mist-100">
              Cancelar
            </button>
          )}
        </div>
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
            {expenses.map((x) => {
              const cat = resolveCategory(options, x.category, x.icon);
              return (
                <MoneyRow
                  key={x.id}
                  label={x.label}
                  icon={cat.icon}
                  meta={`${cat.label} · ${TYPE_LABEL[x.type]} · ${RECURRENCE_LABEL[x.recurrence]}`}
                  amount={formatEUR(Number(x.amount))}
                  amountTone="negative"
                  isEditing={editingId === x.id}
                  onEdit={() => startEdit(x)}
                  onDelete={() => handleDelete(x)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
