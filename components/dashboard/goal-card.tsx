"use client";

import { clsx } from "clsx";
import { calculateGoalProgress } from "@/lib/finance-engine/core";
import { GOAL_TYPES, GOAL_PRIORITIES } from "@/lib/constants/goal-options";
import { GOAL_TYPE_ICONS } from "@/lib/money/categories";

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

const PRIORITY_TONE: Record<string, string> = {
  HIGH: "bg-signal-amber/10 text-signal-amber",
  MEDIUM: "bg-mist-200/70 text-ink-600 dark:bg-ink-700 dark:text-mist-300",
  LOW: "bg-mist-100 text-mist-400 dark:bg-ink-800 dark:text-ink-600",
};

// En pantallas táctiles los botones se ven siempre; en escritorio, con hover o foco
const ACTION =
  "h-8 w-8 flex items-center justify-center rounded-md text-mist-400 transition-all hover:bg-mist-100 dark:hover:bg-ink-800 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100";

export function GoalCard({
  goal,
  isEditing = false,
  onEdit,
  onDelete,
}: {
  goal: {
    id: string;
    name: string;
    type: string;
    icon?: string | null;
    targetAmount: string;
    currentAmount: string;
    targetDate: string | null;
    monthlyContribution: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
  };
  isEditing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = calculateGoalProgress({
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    monthlyContribution: Number(goal.monthlyContribution),
    targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
  });

  const typeLabel = GOAL_TYPES.find((t) => t.value === goal.type)?.label ?? goal.type;
  const icon = goal.icon || GOAL_TYPE_ICONS[goal.type] || "🎯";
  const done = progress.progressPct >= 100;

  return (
    <div className={clsx("group card p-5 transition-shadow", isEditing && "ring-2 ring-wealth-500")}>
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-mist-100 dark:bg-ink-800 text-xl"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{goal.name}</p>
            <p className="text-xs text-ink-600 dark:text-mist-400 mt-0.5">{typeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`eyebrow px-2 py-0.5 rounded-full mr-1 ${PRIORITY_TONE[goal.priority]}`}>
            {GOAL_PRIORITIES.find((p) => p.value === goal.priority)?.label}
          </span>
          <button
            onClick={onEdit}
            aria-label={`Editar ${goal.name}`}
            className={clsx(ACTION, "hover:text-wealth-500", isEditing && "!opacity-100 text-wealth-500")}
          >
            <i className="ti ti-pencil text-base" aria-hidden="true" />
          </button>
          <button onClick={onDelete} aria-label={`Eliminar ${goal.name}`} className={clsx(ACTION, "hover:text-signal-red")}>
            <i className="ti ti-trash text-base" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <span className="figure text-2xl font-medium">{formatEUR(Number(goal.currentAmount))}</span>
        <span className="text-xs text-ink-600 dark:text-mist-400">de {formatEUR(Number(goal.targetAmount))}</span>
      </div>
      <div className="h-1.5 rounded-full bg-mist-100 dark:bg-ink-700 overflow-hidden">
        <div className="h-full bg-wealth-500 transition-all" style={{ width: `${Math.min(progress.progressPct, 100)}%` }} />
      </div>

      <div className="flex justify-between mt-2.5 text-xs text-ink-600 dark:text-mist-400">
        <span>{Math.round(progress.progressPct)}% completado</span>
        <span>{done ? "¡Conseguido!" : `Faltan ${formatEUR(progress.amountMissing)}`}</span>
      </div>

      {progress.monthsRemaining !== null && !done && (
        <div className="mt-4 pt-4 border-t border-mist-100 dark:border-ink-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-ink-600 dark:text-mist-400">Meses restantes</span>
            <span className="mono-data">{progress.monthsRemaining}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-600 dark:text-mist-400">Aportación necesaria</span>
            <span className="mono-data">{formatEUR(progress.requiredMonthlyContribution ?? 0)}/mes</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-600 dark:text-mist-400">Aportación actual</span>
            <span
              className={`mono-data font-medium flex items-center gap-1 ${progress.onTrack ? "text-wealth-500" : "text-signal-amber"}`}
            >
              <i className={`ti ${progress.onTrack ? "ti-check" : "ti-alert-triangle"} text-sm`} aria-hidden="true" />
              {formatEUR(Number(goal.monthlyContribution))}/mes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
