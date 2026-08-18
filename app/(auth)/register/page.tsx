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

    // Nota: el flujo guiado de onboarding (sección 16 del spec) todavía no está
    // construido — se hará en una fase futura. Por ahora, tras registrarse el
    // usuario va directo al Dashboard, que ya funciona con estados vacíos.
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] bg-ink-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-wealth-500 flex items-center justify-center">
            <i className="ti ti-compass text-ink-950 text-base" aria-hidden="true" />
          </div>
          <span className="figure text-lg font-medium text-white">WealthPilot</span>
        </div>
        <div>
          <p className="eyebrow text-mist-400 mb-3">Empieza en 5 minutos</p>
          <p className="figure text-3xl text-white leading-tight mb-4">
            Introduce tus ingresos y gastos.<br />
            <span className="text-wealth-400">Nosotros calculamos el resto.</span>
          </p>
          <p className="text-sm text-mist-400 max-w-sm">
            Capacidad de ahorro, objetivos, perfil de riesgo y una propuesta
            orientativa de inversión — todo a partir de tus datos reales.
          </p>
        </div>
        <p className="text-xs text-mist-400">© 2026 WealthPilot</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 bg-mist-100 dark:bg-ink-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-7 h-7 rounded-md bg-wealth-500 flex items-center justify-center">
              <i className="ti ti-compass text-ink-950 text-base" aria-hidden="true" />
            </div>
            <span className="figure text-lg font-medium">WealthPilot</span>
          </div>

          <p className="text-lg font-medium mb-1">Crea tu cuenta</p>
          <p className="text-sm text-ink-600 dark:text-mist-400 mb-6">Gratis, sin tarjeta.</p>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="field-label" htmlFor="name">Nombre</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field-input"
              />
              <p className="text-xs text-ink-600 dark:text-mist-400 mt-1.5">Mínimo 8 caracteres.</p>
            </div>
            {error && <p className="text-sm text-signal-red">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
          <p className="text-sm text-center mt-5 text-ink-600 dark:text-mist-400">
            ¿Ya tienes cuenta? <a href="/login" className="font-medium text-ink-900 dark:text-mist-100 hover:text-wealth-500 transition-colors">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
