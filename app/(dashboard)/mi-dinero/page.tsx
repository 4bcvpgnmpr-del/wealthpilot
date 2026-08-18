import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { calculateMonthlyFlow } from "@/lib/finance-engine/core";
import { MoneyManager } from "@/components/dashboard/money-manager";

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function toMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum;
  }, 0);
}

export default async function MiDineroPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const [incomes, expenses, assets, liabilities] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.liability.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  // Serializamos explícitamente los Decimal de Prisma a string (no son JSON-serializables
  // tal cual al pasarlos de un server component a un client component)
  const serializedIncomes = incomes.map((i) => ({ ...i, amount: i.amount.toString() }));
  const serializedExpenses = expenses.map((e) => ({ ...e, amount: e.amount.toString() }));
  const serializedAssets = assets.map((a) => ({ ...a, amount: a.amount.toString() }));
  const serializedLiabilities = liabilities.map((l) => ({
    ...l,
    outstanding: l.outstanding.toString(),
    interestRate: l.interestRate.toString(),
    monthlyPayment: l.monthlyPayment.toString(),
    endDate: l.endDate?.toISOString() ?? null,
  }));

  const hasData = incomes.length > 0 || expenses.length > 0;
  const flow = hasData
    ? calculateMonthlyFlow({
        monthlyIncomeTotal: toMonthly(incomes),
        monthlyExpenseTotal: toMonthly(expenses),
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Gestión financiera</p>
        <h1 className="figure text-3xl font-medium mb-1">Mi dinero</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Introduce tus ingresos, gastos, ahorros y deudas. El resto de la app se calcula a partir de estos datos.
        </p>
      </header>

      {flow && (
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="eyebrow text-mist-400 mb-2">Capacidad de ahorro</p>
            <p className={`figure text-2xl font-medium ${flow.savingsCapacity >= 0 ? "text-wealth-500" : "text-signal-red"}`}>
              {formatEUR(flow.savingsCapacity)}
            </p>
          </div>
          <div className="card p-4">
            <p className="eyebrow text-mist-400 mb-2">Disponible para invertir</p>
            <p className="figure text-2xl font-medium text-wealth-500">{formatEUR(flow.availableToInvest)}</p>
          </div>
          <div className="card p-4 col-span-2 lg:col-span-1">
            <p className="eyebrow text-mist-400 mb-2">Deudas totales</p>
            <p className="figure text-2xl font-medium">
              {formatEUR(liabilities.reduce((s, l) => s + Number(l.outstanding), 0))}
            </p>
          </div>
        </section>
      )}

      <MoneyManager
        initialData={{
          incomes: serializedIncomes,
          expenses: serializedExpenses,
          assets: serializedAssets,
          liabilities: serializedLiabilities,
        }}
      />
    </div>
  );
}
