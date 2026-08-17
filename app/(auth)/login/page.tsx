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
    <div className="min-h-screen flex items-center justify-center bg-mist-100 dark:bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <p className="figure text-2xl font-medium mb-8 text-center">WealthPilot</p>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-signal-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-ink-600 dark:text-mist-400">
          ¿No tienes cuenta? <a href="/register" className="font-medium text-ink-900 dark:text-mist-100">Crear cuenta</a>
        </p>
      </div>
    </div>
  );
}
