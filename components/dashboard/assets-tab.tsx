"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mergeCategories, resolveCategory } from "@/lib/money/categories";
import { formatEUR, saveRecord } from "@/lib/money/client";
import { MoneyRow } from "./money-row";
import { IconPicker } from "./icon-picker";
import { CategoryPicker, type UserCategory } from "./category-picker";

type Asset = { id: string; label: string; type: string; icon: string | null; amount: string };

const EMPTY = { label: "", type: "BANK_ACCOUNT", icon: null as string | null, amount: "" };

export function AssetsTab({
  initialAssets,
  categories,
  onCategoriesChange,
}: {
  initialAssets: Asset[];
  categories: UserCategory[];
  onCategoriesChange: (next: UserCategory[]) => void;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter(); // refresca las tarjetas de resumen (calculadas en el servidor)

  const options = mergeCategories("ASSET", categories);
  const categoryIcon = resolveCategory(options, form.type).icon;

  function startEdit(a: Asset) {
    setEditingId(a.id);
    setForm({ label: a.label, type: a.type, icon: a.icon, amount: String(Number(a.amount)) });
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
    if (!form.label.trim()) return setError("Ponle un nombre a este activo.");
    if (form.amount === "" || amount < 0) return setError("Introduce un importe válido.");

    setSubmitting(true);
    const result = await saveRecord<Asset>("assets", { ...form, amount }, editingId, "No se pudo guardar el activo.");
    setSubmitting(false);
    if (!result.ok) return setError(result.error);

    const saved = { ...result.data, amount: String(result.data.amount) };
    setAssets(editingId ? assets.map((a) => (a.id === editingId ? saved : a)) : [saved, ...assets]);
    cancelEdit();
    router.refresh();
  }

  async function handleDelete(item: Asset) {
    if (!window.confirm(`¿Eliminar "${item.label}"?`)) return;
    const previous = assets;
    setAssets(assets.filter((a) => a.id !== item.id));
    if (editingId === item.id) cancelEdit();
    const res = await fetch(`/api/assets/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setAssets(previous);
      setError("No se pudo eliminar el activo.");
    } else {
      router.refresh();
    }
  }

  const total = assets.reduce((sum, a) => sum + Number(a.amount), 0);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <form ref={formRef} onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit scroll-mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{editingId ? "Editar activo" : "Añadir activo"}</p>
          {editingId && <span className="eyebrow text-[10px] text-wealth-500">Editando</span>}
        </div>
        <div>
          <label className="field-label" htmlFor="asset-label">Nombre</label>
          <div className="flex gap-2">
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} fallbackIcon={categoryIcon} />
            <input
              id="asset-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Cuenta corriente BBVA"
              className="field-input flex-1"
            />
          </div>
        </div>
        <CategoryPicker
          kind="ASSET"
          label="Tipo"
          value={form.type}
          onChange={(type) => setForm({ ...form, type })}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
        />
        <div>
          <label className="field-label" htmlFor="asset-amount">Importe (€)</label>
          <input
            id="asset-amount"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="5000"
            className="field-input"
          />
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir activo"}
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
          <p className="text-sm font-medium">Tus ahorros y activos</p>
          {assets.length > 0 && <p className="mono-data text-sm text-wealth-500 font-medium">{formatEUR(total)}</p>}
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-10 text-center">
            Todavía no has añadido ningún activo.
          </p>
        ) : (
          <div className="mt-2">
            {assets.map((a) => {
              const cat = resolveCategory(options, a.type, a.icon);
              return (
                <MoneyRow
                  key={a.id}
                  label={a.label}
                  icon={cat.icon}
                  meta={cat.label}
                  amount={formatEUR(Number(a.amount))}
                  isEditing={editingId === a.id}
                  onEdit={() => startEdit(a)}
                  onDelete={() => handleDelete(a)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
