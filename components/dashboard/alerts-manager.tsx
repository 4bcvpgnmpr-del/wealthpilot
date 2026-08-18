"use client";

import { useState, useEffect } from "react";

type Alert = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  isEnabled: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  MONTHLY_AVAILABLE: "ti-coin",
  GOAL_PROGRESS: "ti-target-arrow",
  EMERGENCY_FUND_LOW: "ti-alert-triangle",
  PORTFOLIO_CHANGE: "ti-trending-up",
  MISSED_CONTRIBUTION: "ti-calendar-x",
};

const TYPE_COLOR: Record<string, string> = {
  MONTHLY_AVAILABLE: "text-wealth-500 bg-wealth-100 dark:bg-wealth-500/10",
  GOAL_PROGRESS: "text-wealth-500 bg-wealth-100 dark:bg-wealth-500/10",
  EMERGENCY_FUND_LOW: "text-signal-amber bg-signal-amber/10",
  PORTFOLIO_CHANGE: "text-ink-900 dark:text-mist-100 bg-mist-200/60 dark:bg-ink-700",
  MISSED_CONTRIBUTION: "text-signal-amber bg-signal-amber/10",
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

export function AlertsManager() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    setAlerts((prev) => prev?.map((a) => (a.id === id ? { ...a, isRead: true } : a)) ?? null);
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
  }

  async function toggleEnabled(id: string, isEnabled: boolean) {
    setAlerts((prev) => prev?.map((a) => (a.id === id ? { ...a, isEnabled } : a)) ?? null);
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled }),
    });
  }

  async function handleDelete(id: string) {
    setAlerts((prev) => prev?.filter((a) => a.id !== id) ?? null);
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-ink-600 dark:text-mist-400">Calculando tus alertas...</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="border border-dashed border-mist-300 dark:border-ink-700 rounded-card p-8 text-center">
        <p className="font-medium mb-1">Sin alertas por ahora</p>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Cuando haya novedades sobre tus objetivos, tu flujo mensual o tu cartera, aparecerán aquí.
        </p>
      </div>
    );
  }

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <p className="text-sm text-ink-600 dark:text-mist-400">
          {unreadCount} {unreadCount === 1 ? "alerta nueva" : "alertas nuevas"}
        </p>
      )}
      <div className="card divide-y divide-mist-100 dark:divide-ink-700">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-4 transition-colors ${!alert.isRead ? "bg-wealth-100/30 dark:bg-wealth-500/[0.03]" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLOR[alert.type] ?? "bg-mist-100"}`}>
              <i className={`ti ${TYPE_ICON[alert.type] ?? "ti-bell"} text-sm`} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!alert.isRead ? "font-medium" : ""} ${!alert.isEnabled ? "opacity-50" : ""}`}>
                {alert.message}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-ink-600 dark:text-mist-400">{timeAgo(alert.createdAt)}</p>
                {!alert.isRead && (
                  <button onClick={() => markRead(alert.id)} className="text-xs text-wealth-500 font-medium hover:underline">
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleEnabled(alert.id, !alert.isEnabled)}
                aria-label={alert.isEnabled ? "Desactivar" : "Activar"}
                className="text-mist-400 hover:text-ink-900 dark:hover:text-mist-100 transition-colors"
                title={alert.isEnabled ? "Desactivar este tipo de alerta" : "Reactivar"}
              >
                <i className={`ti ${alert.isEnabled ? "ti-bell" : "ti-bell-off"} text-base`} aria-hidden="true" />
              </button>
              <button
                onClick={() => handleDelete(alert.id)}
                aria-label="Eliminar"
                className="text-mist-300 dark:text-ink-600 hover:text-signal-red transition-colors"
              >
                <i className="ti ti-trash text-base" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
