export function MetricCard({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-wealth-500"
      : tone === "negative"
        ? "text-signal-red"
        : "text-ink-900 dark:text-mist-100";

  return (
    <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
      <p className="text-sm text-ink-600 dark:text-mist-400 mb-1">{label}</p>
      <p className={`figure text-3xl font-medium ${valueColor}`}>{value}</p>
      {sublabel && <p className="text-xs text-ink-600 dark:text-mist-400 mt-1">{sublabel}</p>}
    </div>
  );
}

export function EmptyState({ title, body, ctaHref, ctaLabel }: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="bg-white dark:bg-ink-900 border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm text-ink-600 dark:text-mist-400 mb-4">{body}</p>
      <a
        href={ctaHref}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-card bg-ink-900 text-white dark:bg-mist-100 dark:text-ink-900 text-sm font-medium"
      >
        {ctaLabel}
        <i className="ti ti-arrow-right text-base" aria-hidden="true" />
      </a>
    </div>
  );
}
