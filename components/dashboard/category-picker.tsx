"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { mergeCategories, type CategoryKind } from "@/lib/money/categories";
import { extractApiError } from "@/lib/money/client";
import { IconPicker } from "./icon-picker";

export type UserCategory = { id: string; kind: string; name: string; icon: string };

// Selector de categoría en forma de "chips" con icono. Incluye las predefinidas,
// las creadas por el usuario y un chip "+ Nueva" para añadir otra al momento.
// Las categorías propias se pueden editar (nombre e icono) o borrar con el lápiz.

export function CategoryPicker({
  kind,
  value,
  onChange,
  categories,
  onCategoriesChange,
  label = "Categoría",
}: {
  kind: CategoryKind;
  value: string;
  onChange: (key: string) => void;
  categories: UserCategory[];
  onCategoriesChange: (next: UserCategory[]) => void;
  label?: string;
}) {
  const options = mergeCategories(kind, categories);
  // null = cerrado · "new" = creando · id = editando esa categoría propia
  const [editor, setEditor] = useState<null | "new" | string>(null);
  const [draft, setDraft] = useState<{ name: string; icon: string | null }>({ name: "", icon: null });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Una categoría que ya no existe (p. ej. se borró) sigue visible si un registro la usa
  const orphan = value && !options.some((o) => o.key === value) ? value : null;

  function openNew() {
    setEditor("new");
    setDraft({ name: "", icon: null });
    setError(null);
  }

  function openEdit(cat: UserCategory) {
    setEditor(cat.id);
    setDraft({ name: cat.name, icon: cat.icon });
    setError(null);
  }

  async function save() {
    const name = draft.name.trim();
    if (!name) return setError("Ponle un nombre.");
    if (!draft.icon) return setError("Elige un icono.");
    setBusy(true);
    setError(null);

    const isNew = editor === "new";
    const res = await fetch(isNew ? "/api/categories" : `/api/categories/${editor}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? { kind, name, icon: draft.icon } : { name, icon: draft.icon }),
    }).catch(() => null);
    setBusy(false);

    const data = await res?.json().catch(() => null);
    if (!res?.ok) return setError(extractApiError(data, "No se pudo guardar la categoría."));

    if (isNew) {
      onCategoriesChange([...categories, data]);
      onChange(data.name); // la nueva queda seleccionada
    } else {
      const previous = categories.find((c) => c.id === editor);
      onCategoriesChange(categories.map((c) => (c.id === editor ? data : c)));
      if (previous && value === previous.name) onChange(data.name);
    }
    setEditor(null);
  }

  async function remove(cat: UserCategory) {
    const ok = window.confirm(
      `¿Eliminar la categoría "${cat.name}"?\n\nLos movimientos que ya la usan no se borran: conservarán el nombre.`,
    );
    if (!ok) return;
    setBusy(true);
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("No se pudo eliminar la categoría.");
    onCategoriesChange(categories.filter((c) => c.id !== cat.id));
    setEditor(null);
  }

  const editingCat = editor && editor !== "new" ? categories.find((c) => c.id === editor) : undefined;

  return (
    <div>
      <span className="field-label">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = opt.key === value;
          return (
            <div key={`${opt.custom ? "c" : "d"}-${opt.key}`} className="relative group/chip">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(opt.key)}
                className={clsx(
                  "flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border text-[12.5px] transition-colors",
                  selected
                    ? "border-wealth-500 bg-wealth-100 text-ink-900 dark:bg-wealth-500/15 dark:text-mist-100"
                    : "border-mist-200 dark:border-ink-700 text-ink-700 dark:text-mist-300 hover:border-mist-400 dark:hover:border-ink-600",
                  opt.custom && "pr-7",
                )}
              >
                <span aria-hidden="true" className="text-[14px] leading-none">{opt.icon}</span>
                {opt.label}
              </button>
              {opt.custom && (
                <button
                  type="button"
                  onClick={() => openEdit(categories.find((c) => c.id === opt.id)!)}
                  aria-label={`Editar categoría ${opt.label}`}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-mist-400 hover:text-wealth-500 hover:bg-mist-100 dark:hover:bg-ink-700"
                >
                  <i className="ti ti-pencil text-[12px]" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}

        {orphan && (
          <span className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border border-dashed border-wealth-500 text-[12.5px] text-ink-700 dark:text-mist-300">
            <span aria-hidden="true">🏷️</span>
            {orphan}
          </span>
        )}

        <button
          type="button"
          onClick={openNew}
          className={clsx(
            "flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed text-[12.5px] transition-colors",
            editor === "new"
              ? "border-wealth-500 text-wealth-500"
              : "border-mist-300 dark:border-ink-600 text-ink-600 dark:text-mist-400 hover:text-wealth-500 hover:border-wealth-400",
          )}
        >
          <i className="ti ti-plus text-[13px]" aria-hidden="true" />
          Nueva
        </button>
      </div>

      {editor && (
        <div className="mt-2.5 p-3 rounded-lg bg-mist-100 dark:bg-ink-800/70 border border-mist-200 dark:border-ink-700 space-y-2.5">
          <p className="text-xs font-medium text-ink-700 dark:text-mist-300">
            {editor === "new" ? "Nueva categoría" : "Editar categoría"}
          </p>
          <div className="flex gap-2">
            <IconPicker
              value={draft.icon}
              onChange={(icon) => setDraft({ ...draft, icon })}
              allowReset={false}
              label="Icono de la categoría"
            />
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
              maxLength={40}
              placeholder="Ej. Mascotas"
              aria-label="Nombre de la categoría"
              className="field-input flex-1"
            />
          </div>
          {error && <p className="text-xs text-signal-red">{error}</p>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={save} disabled={busy} className="btn-primary !py-1.5 !px-3 text-xs">
              {busy ? "Guardando…" : editor === "new" ? "Crear" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="px-3 py-1.5 text-xs text-ink-600 dark:text-mist-400 hover:text-ink-900 dark:hover:text-mist-100"
            >
              Cancelar
            </button>
            {editingCat && (
              <button
                type="button"
                onClick={() => remove(editingCat)}
                disabled={busy}
                className="ml-auto px-2 py-1.5 text-xs text-signal-red/80 hover:text-signal-red"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
