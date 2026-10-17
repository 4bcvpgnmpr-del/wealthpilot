"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mergeCategories, resolveCategory } from "@/lib/money/categories";
import { formatEUR, saveRecord } from "@/lib/money/client";
import { MoneyRow } from "./money-row";
import { IconPicker } from "./icon-picker";
import { CategoryPicker, type UserCategory } from "./category-picker";

type Liability = {
  id: string;
  label: string;
  type: string;
  icon: string | null;
  outstanding: string;
  interestRate: string;
  monthlyPayment: string;
};

const EMPTY = {
  label: "",
  type: "prestamo_personal",
  icon: null as string | null,
  outstanding: "",
  interestRate: "",
  monthlyPayment: "",
};

export function LiabilitiesTab({
  initialLiabilities,
  categories,
  onCategoriesChange,
}: {
  initialLiabilities: Liability[];
  categories: UserCategory[];
  onCategoriesChange: (next: UserCategory[]) => void;
}) {
  const [liabilities, setLiabilities] = useState(initialLiabilities);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter(); // refresca las tarjetas de resumen (calculadas en el servidor)

  const options = mergeCategories("LIABILITY", categories);
  const categoryIcon = resolveCategory(options, form.type).icon;

  function startEdit(l: Liability) {
    setEditingId(l.id);
    setForm({
      label: l.label,
      type: l.type,
      icon: l.icon,
      outstanding: String(Number(l.outstanding)),
      interestRate: String(Number(l.interestRate)),
      monthlyPayment: String(Number(l.monthlyPayment)),
    });
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

    const outstanding = Number(form.outstanding);
    const interestRate = Number(form.interestRate);
    const monthlyPayment = Number(form.monthlyPayment);

    if (!form.label.trim()) return setError("Ponle un nombre a esta deuda.");
    if (form.outstanding === "" || outstanding < 0) return setError("Introduce el importe pendiente.");
    if (form.monthlyPayment === "" || monthlyPayment < 0) return setError("Introduce la cuota mensual.");

    setSubmitting(true);
    const result = await saveRecord<Liability>(
      "liabilities",
      { label: form.label, type: form.type, icon: form.icon, outstanding, interestRate: interestRate || 0, monthlyPayment },
      editingId,
      "No se pudo guardar la deuda.",
    );
    setSubmitting(false);
    if (!result.ok) return setError(result.error);

    const d = result.data;
    const saved = {
      ...d,
      outstanding: String(d.outstanding),
      interestRate: String(d.interestRate),
      monthlyPayment: String(d.monthlyPayment),
    };
    setLiabilities(editingId ? liabilities.map((l) => (l.id === editingId ? saved : l)) : [saved, ...liabilities]);
    cancelEdit();
    router.refresh();
  }

  async function handleDelete(item: Liability) {
    if (!window.confirm(`¿Eliminar la deuda "${item.label}"?`)) return;
    const previous = liabilities;
    setLiabilities(liabilities.filter((l) => l.id !== item.id));
    if (editingId === item.id) cancelEdit();
    const res = await fetch(`/api/liabilities/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setLiabilities(previous);
      setError("No se pudo eliminar la deuda.");
    } else {
      router.refresh();
    }
  }

  const total = liabilities.reduce((sum, l) => sum + Number(l.outstanding), 0);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <form ref={formRef} onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit scroll-mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{editingId ? "Editar deuda" : "Añadir deuda"}</p>
          {editingId && <span className="eyebrow text-[10px] text-wealth-500">Editando</span>}
        </div>
        <div>
          <label className="field-label" htmlFor="liability-label">Nombre</label>
          <div className="flex gap-2">
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} fallbackIcon={categoryIcon} />
            <input
              id="liability-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Préstamo coche"
              className="field-input flex-1"
            />
          </div>
        </div>
        <CategoryPicker
          kind="LIABILITY"
          label="Tipo"
          value={form.type}
          onChange={(type) => setForm({ ...form, type })}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="liability-outstanding">Pendiente (€)</label>
            <input
              id="liability-outstanding"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.outstanding}
              onChange={(e) => setForm({ ...form, outstanding: e.target.value })}
              placeholder="8000"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="liability-interest">Interés (%)</label>
            <input
              id="liability-interest"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
              placeholder="5.5"
              className="field-input"
            />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="liability-payment">Cuota mensual (€)</label>
          <input
            id="liability-payment"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.monthlyPayment}
            onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
            placeholder="200"
            className="field-input"
          />
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir deuda"}
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
          <p className="text-sm font-medium">Tus deudas</p>
          {liabilities.length > 0 && <p className="mono-data text-sm text-signal-red font-medium">{formatEUR(total)}</p>}
        </div>
        {liabilities.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-10 text-center">
            Todavía no has añadido ninguna deuda.
          </p>
        ) : (
          <div className="mt-2">
            {liabilities.map((l) => {
              const cat = resolveCategory(options, l.type, l.icon);
              return (
                <MoneyRow
                  key={l.id}
                  label={l.label}
                  icon={cat.icon}
                  meta={`${cat.label} · cuota ${formatEUR(Number(l.monthlyPayment))}/mes`}
                  amount={formatEUR(Number(l.outstanding))}
                  amountTone="negative"
                  isEditing={editingId === l.id}
                  onEdit={() => startEdit(l)}
                  onDelete={() => handleDelete(l)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
