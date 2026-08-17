"use client";

import { useState } from "react";
import { ASSET_TYPES } from "@/lib/constants/money-categories";
import { MoneyRow } from "./money-row";

type Asset = { id: string; label: string; type: string; amount: string };

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export function AssetsTab({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [form, setForm] = useState({ label: "", type: "BANK_ACCOUNT", amount: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.label.trim()) return setError("Ponle un nombre a este activo.");
    if (form.amount === "" || amount < 0) return setError("Introduce un importe válido.");

    setSubmitting(true);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo guardar el activo.");
      return;
    }

    const created = await res.json();
    setAssets([created, ...assets]);
    setForm({ label: "", type: "BANK_ACCOUNT", amount: "" });
  }

  async function handleDelete(id: string) {
    setAssets(assets.filter((a) => a.id !== id));
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5 space-y-3 h-fit">
        <p className="font-medium text-sm mb-1">Añadir activo</p>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Nombre</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Cuenta corriente BBVA"
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-600 dark:text-mist-400 block mb-1">Importe (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="5000"
            className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-signal-red">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Guardando..." : "Añadir activo"}
        </button>
      </form>

      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
        <p className="font-medium text-sm mb-2">Tus ahorros y activos</p>
        {assets.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mist-400 py-6 text-center">
            Todavía no has añadido ningún activo.
          </p>
        ) : (
          assets.map((a) => (
            <MoneyRow
              key={a.id}
              label={a.label}
              meta={ASSET_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
              amount={formatEUR(Number(a.amount))}
              onDelete={() => handleDelete(a.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
