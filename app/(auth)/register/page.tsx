"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? data.error ?? "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    // Auto login tras registro
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    // Nota: el flujo guiado de onboarding (sección 16 del spec) todavía no está
    // construido — se hará en una fase futura. Por ahora, tras registrarse el
    // usuario va directo al Dashboard, que ya funciona con estados vacíos.
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist-100 dark:bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <p className="figure text-2xl font-medium mb-8 text-center">WealthPilot</p>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="name">Nombre</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
            />
            <p className="text-xs text-ink-600 dark:text-mist-400 mt-1">Mínimo 8 caracteres.</p>
          </div>
          {error && <p className="text-sm text-signal-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-ink-600 dark:text-mist-400">
          ¿Ya tienes cuenta? <a href="/login" className="font-medium text-ink-900 dark:text-mist-100">Entrar</a>
        </p>
      </div>
    </div>
  );
}
