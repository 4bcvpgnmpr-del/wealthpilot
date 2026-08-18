import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AlertsManager } from "@/components/dashboard/alerts-manager";

export default async function AlertasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Notificaciones</p>
        <h1 className="figure text-3xl font-medium mb-1">Alertas</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Novedades sobre tu flujo mensual, tus objetivos y tu cartera.
        </p>
      </header>

      <AlertsManager />
    </div>
  );
}
