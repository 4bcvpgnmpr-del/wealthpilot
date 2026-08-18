import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BROKER_ADAPTER_REGISTRY } from "@/lib/brokers/adapter";
import { BrokerCard } from "@/components/dashboard/broker-card";

export default async function PlataformasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // La lista se lee del registro real de adapters (lib/brokers/adapter.ts),
  // no de una lista duplicada en la UI — si algún adapter pasa a estar
  // implementado, se reflejaría aquí automáticamente sin tocar esta página.
  const providers = Object.keys(BROKER_ADAPTER_REGISTRY);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Integraciones</p>
        <h1 className="figure text-3xl font-medium mb-1">Plataformas</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Conecta tus brokers y bancos para sincronizar tu cartera automáticamente.
        </p>
      </header>

      <div className="rounded-card p-4 bg-mist-200/50 dark:bg-ink-800 text-xs text-ink-600 dark:text-mist-400 flex items-start gap-2">
        <i className="ti ti-info-circle text-sm mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Ninguna integración está activa todavía. Cuando se active alguna, nunca almacenaremos tus
          credenciales en texto plano — solo tokens, siguiendo el estándar OAuth de cada proveedor.
        </p>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <BrokerCard key={provider} provider={provider} />
        ))}
      </div>
    </div>
  );
}
