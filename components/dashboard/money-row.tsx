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
    <div className="flex items-center justify-between py-3 border-b border-mist-200 dark:border-ink-700 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-600 dark:text-mist-400">{meta}</p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`mono-data text-sm ${amountTone === "negative" ? "text-signal-red" : "text-ink-900 dark:text-mist-100"}`}
        >
          {amount}
        </span>
        <button
          onClick={onDelete}
          aria-label={`Eliminar ${label}`}
          className="text-ink-600 dark:text-mist-400 hover:text-signal-red transition-colors"
        >
          <i className="ti ti-trash text-base" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
