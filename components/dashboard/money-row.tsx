"use client";

import { clsx } from "clsx";

export function MoneyRow({
  label,
  meta,
  icon,
  amount,
  amountTone = "neutral",
  isEditing = false,
  onEdit,
  onDelete,
}: {
  label: string;
  meta: string;
  icon: string;
  amount: string;
  amountTone?: "neutral" | "negative";
  isEditing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // En pantallas táctiles (sin hover) los botones se muestran siempre; en escritorio,
  // al pasar el ratón o con el foco del teclado.
  const action =
    "h-8 w-8 flex items-center justify-center rounded-md transition-all lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100";

  return (
    <div
      className={clsx(
        "group flex items-center gap-3 py-3 border-b border-mist-100 dark:border-ink-700 last:border-0 -mx-2 px-2 rounded-lg transition-colors",
        isEditing && "bg-wealth-100/70 dark:bg-wealth-500/10",
      )}
    >
      <span
        aria-hidden="true"
        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-mist-100 dark:bg-ink-800 text-lg"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-ink-600 dark:text-mist-400 mt-0.5 truncate">{meta}</p>
      </div>
      <span
        className={`mono-data text-sm shrink-0 ${amountTone === "negative" ? "text-signal-red" : "text-ink-900 dark:text-mist-100"}`}
      >
        {amount}
      </span>
      <div className="flex items-center shrink-0 -mr-1">
        <button
          onClick={onEdit}
          aria-label={`Editar ${label}`}
          className={clsx(action, "text-mist-400 dark:text-mist-400 hover:text-wealth-500 hover:bg-mist-100 dark:hover:bg-ink-800", isEditing && "!opacity-100 text-wealth-500")}
        >
          <i className="ti ti-pencil text-base" aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          aria-label={`Eliminar ${label}`}
          className={clsx(action, "text-mist-400 dark:text-mist-400 hover:text-signal-red hover:bg-mist-100 dark:hover:bg-ink-800")}
        >
          <i className="ti ti-trash text-base" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
