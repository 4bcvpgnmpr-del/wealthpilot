"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RECURRENCE_OPTIONS } from "@/lib/constants/money-categories";
import { mergeCategories, resolveCategory } from "@/lib/money/categories";
import { formatEUR, RECURRENCE_LABEL, saveRecord, toMonthly } from "@/lib/money/client";
import { MoneyRow } from "./money-row";
import { IconPicker } from "./icon-picker";
import { CategoryPicker, type UserCategory } from "./category-picker";

type Income = {
  id: string;
  label: string;
  category: string;
  icon: string | null;
  amount: string;
  recurrence: "ONE_TIME" | "MONTHLY" | "ANNUAL";
};

const EMPTY = { label: "", category: "salario", icon: null as string | null, amount: "", recurrence: "MONTHLY" };

export function IncomeTab({
  initialIncomes,
  categories,
  onCategoriesChange,
}: {
  initialIncomes: Income[];
  categories: UserCategory[];
  onCategoriesChange: (next: UserCategory[]) => void;
}) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter(); // refresca las tarjetas de resumen (calculadas en el servidor)

  const options = mergeCategories("INCOME", categories);
  const categoryIcon = resolveCategory(options, form.category).icon;

  function startEdit(i: Income) {
    setEditingId(i.id);
    setForm({ label: i.label, category: i.category, icon: i.icon, amount: String(Number(i.amount)), recurrence: i.recurrence });
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
    if (!form.label.trim()) return setError("Ponle un nombre a este ingreso.");
    if (!amount || amount <= 0) return setError("Introduce un importe mayor que 0.");

    setSubmitting(true);
    const result = await saveRecord<Income>("income", { ...form, amount }, editingId, "No se pudo guardar el ingreso.");
    setSubmitting(false);
    if (!result.ok) return setError(result.error);

    const saved = { ...result.data, amount: String(result.data.amount) };
    setIncomes(editingId ? incomes.map((i) => (i.id === editingId ? saved : i)) : [saved, ...incomes]);
    cancelEdit();
    router.refresh();
  }

  async function handleDelete(item: Income) {
    if (!window.confirm(`¿Eliminar el ingreso "${item.label}"?`)) return;
    const previous = incomes;
    setIncomes(incomes.filter((i) => i.id !== item.id));
    if (editingId === item.id) cancelEdit();
    const res = await fetch(`/api/income/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setIncomes(previous);
      setError("No se pudo eliminar el ingreso.");
    } else {
      router.refresh();
    }
  }

  const totalMonthly = toMonthly(incomes);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <form ref={formRef} onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit scroll-mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{editingId ? "Editar ingreso" : "Añadir ingreso"}</p>
          {editingId && (
            <span className="eyebrow text-[10px] text-wealth-500">Editando</span>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="income-label">Nombre</label>
          <div className="flex gap-2">
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} fallbackIcon={categoryIcon} />
            <input
              id="income-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Nómina mensual"
              className="field-input flex-1"
            />
          </div>
        </div>
        <CategoryPicker
          kind="INCOME"
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="income-recurrence">Recurrencia</label>
            <select
              id="income-recurrence"
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
            <label className="field-label" htmlFor="income-amount">Importe (€)</label>
            <input
              id="income-amount"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1800"
              className="field-input"
            />
          </div>
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir ingreso"}
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
          <p className="text-sm font-medium">Tus ingresos</p>
          {incomes.length > 0 && (
            <p className="text-xs text-ink-600 dark:text-mist-400">
              <span className="mono-data text-wealth-500 font-medium">{formatEUR(totalMonthly)}</span> / mes
            </p>
          )}
        </div>
        {incomes.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-10 text-center">
            Todavía no has añadido ningún ingreso.
          </p>
        ) : (
          <div className="mt-2">
            {incomes.map((i) => {
              const cat = resolveCategory(options, i.category, i.icon);
              return (
                <MoneyRow
                  key={i.id}
                  label={i.label}
                  icon={cat.icon}
                  meta={`${cat.label} · ${RECURRENCE_LABEL[i.recurrence]}`}
                  amount={formatEUR(Number(i.amount))}
                  isEditing={editingId === i.id}
                  onEdit={() => startEdit(i)}
                  onDelete={() => handleDelete(i)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
