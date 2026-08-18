"use client";

export function MoneyRow({
  label,
  meta,
  amount,
  amountTone = "neutral",
  onDelete,
}: {
  label: string;
  meta: string;
  amount: string;
  amountTone?: "neutral" | "negative";
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center justify-between py-3.5 border-b border-mist-100 dark:border-ink-700 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-ink-600 dark:text-mist-400 mt-0.5">{meta}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span
          className={`mono-data text-sm ${amountTone === "negative" ? "text-signal-red" : "text-ink-900 dark:text-mist-100"}`}
        >
          {amount}
        </span>
        <button
          onClick={onDelete}
          aria-label={`Eliminar ${label}`}
          className="text-mist-300 dark:text-ink-600 hover:text-signal-red transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <i className="ti ti-trash text-base" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
