import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Simulator } from "@/components/dashboard/simulator";

export default async function SimuladorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Proyección</p>
        <h1 className="figure text-3xl font-medium mb-1">Simulador</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Ajusta las variables y observa cómo cambia la proyección al instante.
        </p>
      </header>

      <Simulator />
    </div>
  );
}
