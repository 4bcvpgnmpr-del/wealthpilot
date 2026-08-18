"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel de marca — oculto en móvil */}
      <div className="hidden lg:flex lg:w-[42%] bg-ink-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-wealth-500 flex items-center justify-center">
            <i className="ti ti-compass text-ink-950 text-base" aria-hidden="true" />
          </div>
          <span className="figure text-lg font-medium text-white">WealthPilot</span>
        </div>
        <div>
          <p className="eyebrow text-mist-400 mb-3">Tu plan financiero</p>
          <p className="figure text-3xl text-white leading-tight mb-4">
            Con el dinero que tienes, tus ingresos y tus objetivos —<br />
            <span className="text-wealth-400">¿qué deberías hacer con tu dinero?</span>
          </p>
          <p className="text-sm text-mist-400 max-w-sm">
            Planificación financiera personal orientativa. Sin ejecutar operaciones,
            sin garantías de rentabilidad — solo claridad sobre tus números.
          </p>
        </div>
        <p className="text-xs text-mist-400">© 2026 WealthPilot</p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center px-4 bg-mist-100 dark:bg-ink-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-7 h-7 rounded-md bg-wealth-500 flex items-center justify-center">
              <i className="ti ti-compass text-ink-950 text-base" aria-hidden="true" />
            </div>
            <span className="figure text-lg font-medium">WealthPilot</span>
          </div>

          <p className="text-lg font-medium mb-1">Bienvenido de nuevo</p>
          <p className="text-sm text-ink-600 dark:text-mist-400 mb-6">Entra para ver tu mapa financiero.</p>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-signal-red">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="text-sm text-center mt-5 text-ink-600 dark:text-mist-400">
            ¿No tienes cuenta? <a href="/register" className="font-medium text-ink-900 dark:text-mist-100 hover:text-wealth-500 transition-colors">Crear cuenta</a>
          </p>
        </div>
      </div>
    </div>
  );
}
