import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { calculateMonthlyFlow } from "@/lib/finance-engine/core";
import { calculateGoalProgress } from "@/lib/finance-engine/core";
import { MetricCard, EmptyState } from "@/components/dashboard/metric-card";

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const [incomes, expenses, assets, liabilities, goals, portfolio] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { priority: "desc" } }),
    prisma.portfolio.findUnique({ where: { userId }, include: { investments: true } }),
  ]);

  const hasMoneyData = incomes.length > 0 || expenses.length > 0;

  const monthlyIncomeTotal = toMonthly(incomes);
  const monthlyExpenseTotal = toMonthly(expenses);
  const flow = hasMoneyData ? calculateMonthlyFlow({ monthlyIncomeTotal, monthlyExpenseTotal }) : null;

  const totalAssets = assets.reduce((sum, a) => sum + Number(a.amount), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstanding), 0);
  const investedValue =
    portfolio?.investments.reduce((sum, i) => sum + Number(i.quantity) * Number(i.currentPrice), 0) ?? 0;
  const netWorth = totalAssets + investedValue - totalLiabilities;
  const hasWealthData = assets.length > 0 || totalLiabilities > 0 || investedValue > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="figure text-2xl font-medium mb-1">Tu mapa financiero</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Resumen de tu situación actual, al minuto.
        </p>
      </header>

      {/* Patrimonio total */}
      {hasWealthData ? (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Patrimonio neto" value={formatEUR(netWorth)} />
          <MetricCard label="Efectivo y activos" value={formatEUR(totalAssets)} />
          <MetricCard label="Inversiones" value={formatEUR(investedValue)} />
          <MetricCard
            label="Deudas"
            value={formatEUR(totalLiabilities)}
            tone={totalLiabilities > 0 ? "negative" : "neutral"}
          />
        </section>
      ) : (
        <EmptyState
          title="Todavía no has introducido tu patrimonio"
          body="Añade tus cuentas, efectivo y deudas para ver tu patrimonio neto aquí."
          ctaHref="/mi-dinero"
          ctaLabel="Introducir mi dinero"
        />
      )}

      {/* Flujo mensual */}
      <section>
        <h2 className="text-lg font-medium mb-3">Flujo mensual</h2>
        {flow ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Ingresos" value={formatEUR(flow.income)} />
            <MetricCard label="Gastos" value={formatEUR(flow.expenses)} />
            <MetricCard
              label="Capacidad de ahorro"
              value={formatEUR(flow.savingsCapacity)}
              tone={flow.savingsCapacity >= 0 ? "positive" : "negative"}
            />
            <MetricCard label="Disponible para invertir" value={formatEUR(flow.availableToInvest)} tone="positive" />
          </div>
        ) : (
          <EmptyState
            title="Todavía no has introducido ingresos ni gastos"
            body="Con tus datos reales calculamos cuánto puedes ahorrar e invertir cada mes."
            ctaHref="/mi-dinero"
            ctaLabel="Introducir ingresos y gastos"
          />
        )}
      </section>

      {/* Objetivos */}
      <section>
        <h2 className="text-lg font-medium mb-3">Objetivos</h2>
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map((g) => {
              const progress = calculateGoalProgress({
                targetAmount: Number(g.targetAmount),
                currentAmount: Number(g.currentAmount),
                monthlyContribution: Number(g.monthlyContribution),
                targetDate: g.targetDate ?? undefined,
              });
              return (
                <div key={g.id} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-5">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="font-medium">{g.name}</p>
                    <p className="mono-data text-sm text-ink-600 dark:text-mist-400">
                      {Math.round(progress.progressPct)}%
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-mist-100 dark:bg-ink-700 overflow-hidden">
                    <div
                      className="h-full bg-wealth-500"
                      style={{ width: `${Math.min(progress.progressPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-600 dark:text-mist-400 mt-2">
                    Faltan {formatEUR(progress.amountMissing)}
                    {progress.monthsRemaining !== null && ` · ${progress.monthsRemaining} meses restantes`}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Todavía no tienes objetivos"
            body="Crea un objetivo (fondo de emergencia, jubilación, comprar coche...) para hacer seguimiento de tu progreso."
            ctaHref="/objetivos"
            ctaLabel="Crear un objetivo"
          />
        )}
      </section>

      {/* Recomendación del mes — solo si hay datos suficientes */}
      <section>
        <h2 className="text-lg font-medium mb-3">Tu plan para este mes</h2>
        {flow && flow.availableToInvest > 0 ? (
          <div className="bg-ink-900 dark:bg-ink-800 text-white rounded-card p-6">
            <p className="text-sm text-mist-300 mb-1">Puedes invertir aproximadamente</p>
            <p className="figure text-3xl font-medium mb-4">{formatEUR(flow.availableToInvest)}</p>
            <a
              href="/plan-inversion"
              className="inline-flex items-center gap-2 text-sm font-medium text-wealth-400"
            >
              Ver análisis completo
              <i className="ti ti-arrow-right text-base" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <EmptyState
            title="Todavía no podemos calcular tu plan"
            body="Necesitamos tus ingresos y gastos para proponerte una distribución orientativa."
            ctaHref="/mi-dinero"
            ctaLabel="Completar mis datos"
          />
        )}
      </section>
    </div>
  );
}

function toMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum;
  }, 0);
}
